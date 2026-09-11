import axios from 'axios';
import { z } from 'zod';
import { config } from '../../config/env.js';

export interface LLMProvider {
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  generateJSON<T>(prompt: string, schema: z.ZodType<T, any, any>, systemPrompt?: string): Promise<T>;
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
      const status = error.response?.status;
      const errMsg = error.message?.toLowerCase() || '';

      // Do not retry permanent client errors (400, 404, 401, 403)
      if (status === 400 || status === 404 || status === 401 || status === 403) {
        throw error;
      }

      attempt++;
      if (attempt > maxRetries) {
        console.error(`[LLM Retry] Exceeded max retries (${maxRetries}). Final error: ${error.message}`);
        throw error;
      }

      // Check for Retry-After header
      const retryAfterHeader = error.response?.headers?.['retry-after'];
      let delayMs: number;
      if (retryAfterHeader && !isNaN(Number(retryAfterHeader))) {
        delayMs = Number(retryAfterHeader) * 1000 + 1000;
      } else if (status === 429 || errMsg.includes('429') || errMsg.includes('resource_exhausted')) {
        // Quota window reset backoff (4s, 8s, 12s, 16s, 20s)
        delayMs = 4000 * attempt + Math.random() * 1000;
      } else {
        const backoffFactor = Math.pow(2, attempt);
        const jitter = Math.random() * 500;
        delayMs = initialDelayMs * backoffFactor + jitter;
      }

      console.warn(`[LLM Retry] Attempt ${attempt}/${maxRetries} failed (${error.message}). Retrying in ${Math.round(delayMs)}ms...`);
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

  constructor(apiKey: string, model: string = 'gemini-3.6-flash') {
    this.apiKey = apiKey;
    // Strip trailing '-medium' or normalize invalid model string
    this.model = (model || 'gemini-3.6-flash').replace('-medium', '');
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    return withRetry(async () => {
      let targetModel = this.model;
      try {
        console.log(`[Gemini API Request] Sending to model "${targetModel}" (API Key: ${this.apiKey.substring(0, 10)}...) | Prompt length: ${prompt.length} chars`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${this.apiKey}`;
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
          throw new Error('Gemini API returned an empty text response.');
        }
        console.log(`[Gemini API Response Success] Model "${targetModel}" returned ${text.length} characters. Sample: "${text.substring(0, 80).replace(/\n/g, ' ')}..."`);
        return text;
      } catch (err: any) {
        const status = err.response?.status;
        if ((status === 503 || status === 404 || status === 400 || status === 429) && targetModel !== 'gemini-2.5-flash') {
          console.warn(`[Gemini Provider] Model ${targetModel} returned ${status}. Falling back to gemini-2.5-flash.`);
          targetModel = 'gemini-2.5-flash';
          const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${this.apiKey}`;
          const res = await axios.post(fallbackUrl, {
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }]
              }
            ],
            generationConfig: { temperature: 0.2 }
          }, { timeout: 30000 });
          const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`[Gemini API Response Success] Model "${targetModel}" returned ${text.length} characters.`);
            return text;
          }
        }
        throw err;
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
      // Execute 1-pass repair loop
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
  async generateText(prompt: string): Promise<string> {
    return `Mock text response for prompt: ${prompt.substring(0, 50)}`;
  }

  async generateJSON<T>(prompt: string, schema: z.ZodType<T, any, any>): Promise<T> {
    // Return structured default mock data based on simple schema inspections
    // This allows evaluator or offline runs to complete deterministically without external keys!
    return schema.parse({}) as T; // Note: actual mock data handlers in extraction/generation services provide rich defaults when provider === 'mock'
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
    return new GeminiProvider(config.llmApiKey, config.llmModel);
  }
  return new MockLLMProvider();
}
