import { describe, it, expect } from 'vitest';
import { ResultFilter } from '../src/services/research/discussions/resultFilter.js';
import { SearchResult } from '../src/services/research/discussions/searchProvider.js';

describe('ResultFilter Unit Tests', () => {
  it('should deduplicate and categorize search result domains', () => {
    const rawResults: SearchResult[] = [
      { title: 'LeetCode Post 1', url: 'https://leetcode.com/discuss/interview-question/123/', content: 'Question content' },
      { title: 'LeetCode Post 1 Duplicate', url: 'https://leetcode.com/discuss/interview-question/123/', content: 'Duplicate content' },
      { title: 'Reddit Thread', url: 'https://www.reddit.com/r/cscareerquestions/comments/abc/ea_interview/', content: 'Reddit content' },
      { title: 'Auth Page', url: 'https://leetcode.com/login', content: 'Login page' }
    ];

    const filtered = ResultFilter.filterResults(rawResults);

    expect(filtered.length).toBe(2);
    expect(filtered[0].sourceType).toBe('leetcode');
    expect(filtered[1].sourceType).toBe('reddit');
  });
});
