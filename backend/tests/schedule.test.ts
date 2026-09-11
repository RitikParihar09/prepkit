import { describe, it, expect } from 'vitest';
import { ScheduleAllocator } from '../src/services/scheduler/scheduleAllocator.js';
import { Requirement, Question } from '../src/services/validation/kitSchema.js';

describe('ScheduleAllocator Unit Tests', () => {
  const sampleRequirements: Requirement[] = [
    { id: 'r1', text: 'Node.js backend development', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'MongoDB and Database Design', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'System Architecture', kind: 'technical', priority: 'must' },
    { id: 'r4', text: 'Docker & Kubernetes', kind: 'technical', priority: 'nice' }
  ];

  const sampleQuestions: Question[] = [
    {
      id: 'q1',
      requirement_ids: ['r1'],
      category: 'technical',
      prompt: 'Explain the Node.js event loop.',
      answer_outline: 'Single-threaded event loop, call stack, microtask/macrotask queues.',
      difficulty: 2
    },
    {
      id: 'q2',
      requirement_ids: ['r2'],
      category: 'technical',
      prompt: 'How do you design indexes in MongoDB for high throughput?',
      answer_outline: 'Compound indexes, ESM rule, covered queries.',
      difficulty: 3
    },
    {
      id: 'q3',
      requirement_ids: ['r3'],
      category: 'system-design',
      prompt: 'Design a scalable rate limiter service.',
      answer_outline: 'Token bucket, sliding window counter in Redis.',
      difficulty: 3
    },
    {
      id: 'q4',
      requirement_ids: ['r4'],
      category: 'technical',
      prompt: 'What are container health checks in Kubernetes?',
      answer_outline: 'Liveness, readiness, startup probes.',
      difficulty: 1
    }
  ];

  it('allocates schedule for exactly 1 day requested', () => {
    const schedule = ScheduleAllocator.allocateSchedule(1, sampleRequirements, sampleQuestions);
    expect(schedule.days_available).toBe(1);
    expect(schedule.days).toHaveLength(1);
    expect(schedule.days[0].day).toBe(1);
    expect(schedule.days[0].question_ids).toEqual(['q2', 'q3', 'q1', 'q4']);
    expect(Number.isInteger(schedule.days[0].minutes)).toBe(true);
    expect(schedule.days[0].minutes).toBeGreaterThan(0);
  });

  it('allocates schedule for exactly 5 days requested', () => {
    const schedule = ScheduleAllocator.allocateSchedule(5, sampleRequirements, sampleQuestions);
    expect(schedule.days_available).toBe(5);
    expect(schedule.days).toHaveLength(5);

    // Verify all returned question IDs exist in sampleQuestions
    const allAllocatedQIds = schedule.days.flatMap(d => d.question_ids);
    const validQIds = sampleQuestions.map(q => q.id);
    allAllocatedQIds.forEach(id => {
      expect(validQIds).toContain(id);
    });

    // Verify all minutes are positive integers
    schedule.days.forEach(d => {
      expect(Number.isInteger(d.minutes)).toBe(true);
      expect(d.minutes).toBeGreaterThan(0);
    });
  });

  it('allocates schedule for 60 days without breaking (sparse question set)', () => {
    const schedule = ScheduleAllocator.allocateSchedule(60, sampleRequirements, sampleQuestions);
    expect(schedule.days_available).toBe(60);
    expect(schedule.days).toHaveLength(60);

    schedule.days.forEach(d => {
      expect(Number.isInteger(d.minutes)).toBe(true);
      expect(d.minutes).toBeGreaterThan(0);
      expect(typeof d.focus).toBe('string');
    });
  });

  it('prioritizes must-have and harder questions earlier in the schedule', () => {
    const schedule = ScheduleAllocator.allocateSchedule(3, sampleRequirements, sampleQuestions);
    // Day 1 should receive top priority/difficulty questions (e.g. q2 or q3 with difficulty 3 and must priority)
    const day1QIds = schedule.days[0].question_ids;
    expect(day1QIds.includes('q2') || day1QIds.includes('q3')).toBe(true);
  });
});
