import { describe, it, expect } from 'vitest';
import { CoverageChecker } from '../src/services/coverage/coverageChecker.js';
import { Requirement, Question } from '../src/services/validation/kitSchema.js';

describe('CoverageChecker Unit Tests', () => {
  const requirements: Requirement[] = [
    { id: 'r1', text: 'Node.js', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'MongoDB', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'GraphQL', kind: 'technical', priority: 'nice' }
  ];

  it('detects 100% coverage when all must-have requirements are mapped', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Node question',
        answer_outline: 'Answer',
        difficulty: 2
      },
      {
        id: 'q2',
        requirement_ids: ['r2'],
        category: 'technical',
        prompt: 'Mongo question',
        answer_outline: 'Answer',
        difficulty: 2
      }
    ];

    const result = CoverageChecker.checkCoverage(requirements, questions, 1);
    expect(result.uncovered_requirement_ids).toEqual([]);
    expect(result.passes).toBe(1);
  });

  it('correctly identifies uncovered must-have requirements', () => {
    const questions: Question[] = [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Node question',
        answer_outline: 'Answer',
        difficulty: 2
      }
    ];

    const result = CoverageChecker.checkCoverage(requirements, questions, 1);
    expect(result.uncovered_requirement_ids).toEqual(['r2']);
  });

  it('simulates 2nd pass gap-closing coverage resolution', () => {
    const pass1Questions: Question[] = [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Node question',
        answer_outline: 'Answer',
        difficulty: 2
      }
    ];

    const pass1Result = CoverageChecker.checkCoverage(requirements, pass1Questions, 1);
    expect(pass1Result.uncovered_requirement_ids).toEqual(['r2']);

    // Pass 2 generated missing question for r2
    const pass2Questions: Question[] = [
      ...pass1Questions,
      {
        id: 'q2',
        requirement_ids: ['r2'],
        category: 'technical',
        prompt: 'Missing Mongo question',
        answer_outline: 'Answer',
        difficulty: 2
      }
    ];

    const pass2Result = CoverageChecker.checkCoverage(requirements, pass2Questions, 2);
    expect(pass2Result.uncovered_requirement_ids).toEqual([]);
    expect(pass2Result.passes).toBe(2);
  });
});
