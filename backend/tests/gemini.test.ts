import { describe, it, expect, vi } from 'vitest';
import { GeminiProvider, GeminiAPIError, extractJSONString } from '../src/services/llm/llmProvider.js';

describe('Gemini LLM Provider & Diagnostics', () => {
  it('extracts JSON string correctly from fenced markdown', () => {
    const raw = '```json\n{"status": "ok"}\n```';
    expect(extractJSONString(raw)).toBe('{"status": "ok"}');
  });

  it('runs model availability diagnostic without throwing', async () => {
    const fakeKey = 'AQ.FakeKeyTestKeyForDiagnostic12345';
    const diag = await GeminiProvider.diagnoseModelAvailability(fakeKey, 'gemini-3.6-flash');
    expect(diag).toHaveProperty('isAvailable');
    expect(diag).toHaveProperty('supportsGenerateContent');
    expect(Array.isArray(diag.availableModels)).toBe(true);
  });

  it('instantiates GeminiProvider with configured GEMINI_MODEL', () => {
    process.env.GEMINI_MODEL = 'gemini-3.6-flash';
    const provider = new GeminiProvider('fake-key');
    expect(provider).toBeInstanceOf(GeminiProvider);
  });
});
