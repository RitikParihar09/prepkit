import { describe, it, expect } from 'vitest';
import { KitSchema, KitData } from '../src/services/validation/kitSchema.js';

describe('Kit Validation Unit Tests (Appendix A Conformance)', () => {
  const validKit: KitData = {
    source: {
      company: 'Acme Corp',
      company_url: 'https://acme.com',
      role: 'Backend Engineer',
      location: 'Remote',
      jd_chars: 1200,
      researched_at: new Date().toISOString(),
      pages_used: ['https://acme.com', 'https://acme.com/jobs']
    },
    company_brief: {
      summary: 'Acme Corp is a cloud software company.',
      what_they_do: 'Build enterprise infrastructure tools.',
      sources: ['https://acme.com']
    },
    role: {
      title: 'Backend Engineer',
      seniority: 'Senior',
      responsibilities: ['Build APIs', 'Scale database clusters'],
      requirements: [
        { id: 'r1', text: '5+ years with React', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Node.js experience', kind: 'technical', priority: 'must' }
      ]
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Explain React Server Components.',
        answer_outline: 'Server rendering, streaming HTML, zero bundle size.',
        difficulty: 2
      }
    ],
    flashcards: [
      {
        id: 'f1',
        front: 'What is hydration?',
        back: 'Attaching event listeners to server HTML.',
        requirement_ids: ['r1']
      }
    ],
    schedule: {
      days_available: 5,
      days: [
        {
          day: 1,
          focus: 'React Fundamentals',
          question_ids: ['q1'],
          minutes: 60
        }
      ]
    },
    coverage: {
      uncovered_requirement_ids: ['r2'],
      passes: 2
    }
  };

  it('successfully validates a fully compliant Appendix A Kit object', () => {
    const result = KitSchema.safeParse(validKit);
    expect(result.success).toBe(true);
  });

  it('rejects kits with invalid difficulty scores (must be 1, 2, or 3)', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    invalidKit.questions[0].difficulty = 5; // Invalid difficulty

    const result = KitSchema.safeParse(invalidKit);
    expect(result.success).toBe(false);
  });

  it('rejects kits where minutes is a float instead of integer', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    invalidKit.schedule.days[0].minutes = 45.5; // Float minute

    const result = KitSchema.safeParse(invalidKit);
    expect(result.success).toBe(false);
  });

  it('rejects kits with missing mandatory Appendix A fields', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    delete invalidKit.company_brief.what_they_do;

    const result = KitSchema.safeParse(invalidKit);
    expect(result.success).toBe(false);
  });
});
