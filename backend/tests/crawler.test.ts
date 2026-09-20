import { describe, it, expect } from 'vitest';
import { CompanyCrawler, validateUrl } from '../src/services/research/companyCrawler.js';

describe('CompanyCrawler & Link Ranking Unit Tests', () => {
  it('should deterministically score links based on keywords', () => {
    const careersScore = CompanyCrawler.scoreLink('/careers', 'Join our engineering team');
    const interviewScore = CompanyCrawler.scoreLink('/interview-process', 'Our Technical Interview Loop');
    const noiseScore = CompanyCrawler.scoreLink('/privacy', 'Privacy Policy');

    expect(careersScore).toBeGreaterThan(0);
    expect(interviewScore).toBeGreaterThan(0);
    expect(noiseScore).toBe(0);
  });

  it('should validate URLs safely and handle SSRF rules', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('invalid-url')).toBe(false);
    expect(validateUrl('ftp://example.com')).toBe(false);
  });
});
