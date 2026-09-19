import axios from 'axios';
import { z } from 'zod';
import { config } from '../../config/env.js';

export interface LLMProvider {
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  generateJSON<T>(prompt: string, schema: z.ZodType<T, any, any>, systemPrompt?: string): Promise<T>;
  runSmokeTest?(): Promise<boolean>;
}

export interface LLMErrorDetails {
  model: string;
  clientType: string;
  httpStatus?: number;
  message: string;
  code?: string;
  availableModels?: string[];
}

export class GeminiAPIError extends Error {
  public details: LLMErrorDetails;
  public code: string;

  constructor(details: LLMErrorDetails) {
    const statusStr = details.httpStatus ? ` (Status: ${details.httpStatus})` : '';
    super(`[Gemini API Error] Model "${details.model}" via ${details.clientType} failed${statusStr}: ${details.message}`);
    this.name = 'GeminiAPIError';
    this.code = details.code || 'GEMINI_API_ERROR';
    this.details = details;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelayMs: number = 2500
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error.response?.status || error.details?.httpStatus;
      const errMsg = error.message || error.details?.message || '';
      const is429 = status === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429');

      // Do not retry permanent client errors (400, 404, 401, 403), EXCEPT 429 which MUST be retried with backoff!
      if (!is429 && (status === 400 || status === 404 || status === 401 || status === 403)) {
        throw error;
      }

      attempt++;
      if (attempt > maxRetries) {
        console.error(`[LLM Retry] Exceeded max retries (${maxRetries}). Final error: ${errMsg}`);
        throw error;
      }

      let delayMs: number;
      if (is429) {
        // Extract "Please retry in X.Xs" from error message if present
        const retryMatch = errMsg.match(/Please retry in\s+([0-9.]+)\s*s/i);
        const retryAfterHeader = error.response?.headers?.['retry-after'];
        if (retryMatch && !isNaN(Number(retryMatch[1]))) {
          delayMs = Math.ceil(Number(retryMatch[1]) * 1000) + 1500;
        } else if (retryAfterHeader && !isNaN(Number(retryAfterHeader))) {
          delayMs = Number(retryAfterHeader) * 1000 + 1500;
        } else {
          delayMs = 6000 * attempt + Math.random() * 1000;
        }
        console.warn(`[Gemini Free Tier Pacing] Rate limit 429 received. Pausing for ${Math.round(delayMs / 1000)}s before retry (${attempt}/${maxRetries})...`);
      } else {
        const backoffFactor = Math.pow(2, attempt);
        const jitter = Math.random() * 500;
        delayMs = initialDelayMs * backoffFactor + jitter;
        console.warn(`[LLM Retry] Attempt ${attempt}/${maxRetries} failed (${errMsg}). Retrying in ${Math.round(delayMs)}ms...`);
      }

      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

/**
 * Extracts and cleans JSON string from LLM output (handles ```json fences)
 */
export function extractJSONString(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const endIdx = Math.max(lastBrace, lastBracket);
    if (endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }
  return cleaned;
}

export class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    const configuredModel = model || process.env.GEMINI_MODEL || process.env.LLM_MODEL || config.geminiModel || 'gemini-3.5-flash-lite';
    this.model = configuredModel.replace('-medium', '');
  }

  /**
   * Diagnostic utility: Lists models available to the current API key that support generateContent.
   * NEVER logs the API key.
   */
  static async diagnoseModelAvailability(apiKey: string, targetModel: string): Promise<{
    isAvailable: boolean;
    supportsGenerateContent: boolean;
    availableModels: string[];
    error?: string;
  }> {
    const clientType = 'v1beta REST models list';
    const modelsEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    try {
      console.log(`[Gemini Diagnostic] Checking model availability via ${clientType} for target model "${targetModel}"...`);
      const url = `${modelsEndpoint}?key=${apiKey}`;
      const res = await axios.get(url, { timeout: 15000 });
      const rawModels: any[] = res.data?.models || [];
      
      const availableModels = rawModels
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => (m.name || '').replace('models/', ''));

      const cleanTarget = targetModel.replace('models/', '');
      const targetObj = rawModels.find(m => (m.name || '').replace('models/', '') === cleanTarget);
      const isAvailable = !!targetObj;
      const supportsGenerateContent = isAvailable && Array.isArray(targetObj.supportedGenerationMethods) && targetObj.supportedGenerationMethods.includes('generateContent');

      console.log(`[Gemini Diagnostic Success] Models available to current key with generateContent support:`, availableModels);
      if (!isAvailable) {
        console.warn(`[Gemini Diagnostic Warning] Configured model "${targetModel}" was NOT found in available models list for this API key.`);
      } else if (!supportsGenerateContent) {
        console.warn(`[Gemini Diagnostic Warning] Configured model "${targetModel}" is present but does NOT list "generateContent" in supported methods.`);
      }

      return {
        isAvailable,
        supportsGenerateContent,
        availableModels
      };
    } catch (err: any) {
      const status = err.response?.status;
      const rawMsg = err.response?.data?.error?.message || err.message || 'Failed to list models';
      const sanitizedMsg = rawMsg.replace(/key=[^&]+/gi, 'key=[REDACTED]');
      console.error(`[Gemini Diagnostic Error] Client: ${clientType} | Status: ${status || 'N/A'} | Error: ${sanitizedMsg}`);
      return {
        isAvailable: false,
        supportsGenerateContent: false,
        availableModels: [],
        error: sanitizedMsg
      };
    }
  }

  /**
   * Gemini Smoke Test: Sends "Reply with exactly: GEMINI_OK" before full pipeline execution.
   */
  async runSmokeTest(): Promise<boolean> {
    console.log(`[Gemini Smoke Test] Sending smoke test to model "${this.model}"...`);
    try {
      const response = await this.generateText('Reply with exactly: GEMINI_OK');
      if (response.includes('GEMINI_OK')) {
        console.log(`[Gemini Smoke Test Passed] Model "${this.model}" responded successfully.`);
        return true;
      }
      const diag = await GeminiProvider.diagnoseModelAvailability(this.apiKey, this.model);
      throw new GeminiAPIError({
        model: this.model,
        clientType: 'v1beta REST generateContent',
        message: `Smoke test returned unexpected response: "${response.substring(0, 100)}"`,
        code: 'SMOKE_TEST_FAILED',
        availableModels: diag.availableModels
      });
    } catch (err: any) {
      if (err instanceof GeminiAPIError && err.details?.httpStatus !== 429) {
        throw err;
      }
      const status = err.response?.status || err.details?.httpStatus;
      const rawMsg = err.response?.data?.error?.message || err.message || 'Gemini smoke test failed';
      const sanitizedMsg = rawMsg.replace(/key=[^&]+/gi, 'key=[REDACTED]');
      const code = err.response?.data?.error?.status || err.code || 'SMOKE_TEST_ERROR';

      const diag = await GeminiProvider.diagnoseModelAvailability(this.apiKey, this.model);

      throw new GeminiAPIError({
        model: this.model,
        clientType: 'v1beta REST generateContent',
        httpStatus: status,
        message: sanitizedMsg,
        code,
        availableModels: diag.availableModels
      });
    }
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    return withRetry(async () => {
      const targetModel = this.model;
      const clientType = 'v1beta REST generateContent';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`;

      // Log request WITHOUT logging API key
      console.log(`[Gemini API Request] Model: "${targetModel}" | Endpoint: ${endpoint} | Client: ${clientType} | Prompt length: ${prompt.length} chars`);

      try {
        const url = `${endpoint}?key=${this.apiKey}`;
        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2
          }
        };

        const res = await axios.post(url, payload, { timeout: 30000 });
        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new GeminiAPIError({
            model: targetModel,
            clientType,
            httpStatus: res.status,
            message: 'Gemini API returned an empty text response candidate.',
            code: 'EMPTY_RESPONSE'
          });
        }

        // Log success WITHOUT logging API key
        console.log(`[Gemini API Success] Model: "${targetModel}" | Client: ${clientType} | HTTP Status: ${res.status} | Response length: ${text.length} chars`);
        return text;
      } catch (err: any) {
        if (err instanceof GeminiAPIError) {
          throw err;
        }

        const status = err.response?.status;
        const errCode = err.response?.data?.error?.status || err.code || 'API_ERROR';
        const rawMsg = err.response?.data?.error?.message || err.message || 'Unknown API request error';
        const sanitizedMsg = rawMsg.replace(/key=[^&]+/gi, 'key=[REDACTED]');

        // Log sanitized error details
        console.error(`[Gemini API Error] Model: "${targetModel}" | Endpoint: ${endpoint} | Client: ${clientType} | HTTP Status: ${status || 'N/A'} | Error: [${errCode}] ${sanitizedMsg}`);

        const apiError = new GeminiAPIError({
          model: targetModel,
          clientType,
          httpStatus: status,
          message: sanitizedMsg,
          code: errCode
        });

        // Run diagnostic if request failed due to client error / unavailable model (e.g. 404 NOT_FOUND)
        if (status === 404 || status === 400 || status === 401 || status === 403) {
          const diag = await GeminiProvider.diagnoseModelAvailability(this.apiKey, targetModel);
          apiError.details.availableModels = diag.availableModels;
        }

        throw apiError;
      }
    });
  }

  async generateJSON<T>(prompt: string, schema: z.ZodType<T, any, any>, systemPrompt?: string): Promise<T> {
    const fullSystemPrompt = (systemPrompt || '') + '\nIMPORTANT: You must respond ONLY with a valid JSON object matching the requested schema. Do not include markdown code block backticks or conversational text.';
    const textResponse = await this.generateText(prompt, fullSystemPrompt);
    const cleanedJSON = extractJSONString(textResponse);

    try {
      const parsedJSON = JSON.parse(cleanedJSON);
      return schema.parse(parsedJSON);
    } catch (parseError: any) {
      console.warn('[LLM JSON Parse Warning] Initial JSON parse failed. Attempting 1-pass repair prompt...', parseError.message);
      const repairPrompt = `The following JSON response was invalid or violated the schema:\n\n${cleanedJSON}\n\nValidation error: ${parseError.message}\n\nPlease fix the JSON formatting and schema compliance. Return ONLY the corrected JSON:`;
      const repairedText = await this.generateText(repairPrompt, fullSystemPrompt);
      const repairedJSON = extractJSONString(repairedText);
      const repairedObject = JSON.parse(repairedJSON);
      return schema.parse(repairedObject);
    }
  }
}

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async runSmokeTest(): Promise<boolean> {
    return true;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    return withRetry(async () => {
      const url = 'https://api.openai.com/v1/chat/completions';
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      const res = await axios.post(
        url,
        {
          model: this.model,
          messages,
          temperature: 0.2
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const text = res.data?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('OpenAI API returned an empty text response.');
      }
      return text;
    });
  }

  async generateJSON<T>(prompt: string, schema: z.ZodType<T, any, any>, systemPrompt?: string): Promise<T> {
    const fullSystemPrompt = (systemPrompt || '') + '\nRespond ONLY with valid JSON.';
    const textResponse = await this.generateText(prompt, fullSystemPrompt);
    const cleanedJSON = extractJSONString(textResponse);

    try {
      const parsedJSON = JSON.parse(cleanedJSON);
      return schema.parse(parsedJSON);
    } catch (parseError: any) {
      console.warn('[LLM JSON Parse Warning] Initial JSON parse failed. Attempting repair...', parseError.message);
      const repairPrompt = `Fix this invalid JSON:\n\n${cleanedJSON}\n\nError: ${parseError.message}\nReturn ONLY valid JSON:`;
      const repairedText = await this.generateText(repairPrompt, fullSystemPrompt);
      const repairedJSON = extractJSONString(repairedText);
      return schema.parse(JSON.parse(repairedJSON));
    }
  }
}

export class MockLLMProvider implements LLMProvider {
  async runSmokeTest(): Promise<boolean> {
    return true;
  }

  async generateText(prompt: string): Promise<string> {
    return `Mock text response for prompt: ${prompt.substring(0, 50)}`;
  }

  async generateJSON<T>(prompt: string, schema: z.ZodType<T, any, any>): Promise<T> {
    return schema.parse({}) as T;
  }
}

export function getLLMProvider(): LLMProvider {
  const provider = config.llmProvider;
  if (provider === 'openai' || provider === 'openrouter') {
    return new OpenAIProvider(config.llmApiKey, config.llmModel);
  } else if (provider === 'gemini') {
    if (!config.llmApiKey) {
      console.warn('[LLM Provider] LLM_API_KEY is not set. Falling back to MockLLMProvider for offline execution.');
      return new MockLLMProvider();
    }
    return new GeminiProvider(config.llmApiKey, config.geminiModel);
  }
  return new MockLLMProvider();
}
