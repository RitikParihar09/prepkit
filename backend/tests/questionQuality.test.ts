import { describe, it, expect } from 'vitest';
import { QuestionGenerator } from '../src/services/generation/questionGenerator.js';
import { Question } from '../src/services/validation/kitSchema.js';

describe('Question Quality Filter Unit Tests', () => {
  const validReqIds = new Set(['r1', 'r2']);

  it('should reject generic nonsense questions generated from city names or raw navigation text', () => {
    const badCityQuestion: Question = {
      id: 'q1',
      requirement_ids: ['r1'],
      category: 'technical',
      prompt: 'How do you apply Hyderabad in a production environment?',
      answer_outline: 'Explain Hyderabad principles',
      difficulty: 1
    };

    const validTechQuestion: Question = {
      id: 'q2',
      requirement_ids: ['r1'],
      category: 'technical',
      prompt: 'How do you design a scalable REST API in Node.js with caching?',
      answer_outline: 'Explain REST principles, caching headers, and rate limiting',
      difficulty: 2
    };

    expect(QuestionGenerator.validateQuestionQuality(badCityQuestion.prompt)).toBe(false);
    expect(QuestionGenerator.validateQuestionQuality(validTechQuestion.prompt)).toBe(true);
  });
});
