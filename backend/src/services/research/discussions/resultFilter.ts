import { validateUrl } from '../companyCrawler.js';
import { SearchResult } from './searchProvider.js';

export interface FilteredResult extends SearchResult {
  sourceType: 'reddit' | 'leetcode' | 'github' | 'hackernews' | 'forum' | 'blog' | 'public_web';
  status: 'success' | 'unavailable' | 'rejected';
  rejectionReason?: string;
}

export class ResultFilter {
  /**
   * Validates, normalizes, deduplicates, and filters raw search results
   */
  static filterResults(results: SearchResult[]): FilteredResult[] {
    const seenUrls = new Set<string>();
    const filtered: FilteredResult[] = [];

    // Irrelevant noise patterns & auth/login paths
    const rejectPattern = /\/login|\/signin|\/signup|\/register|\/auth|\/privacy|\/terms|\/legal|\/cart|\/checkout|\/subscribe|\/pricing|\/captcha/i;

    for (const res of results) {
      if (!res.url || typeof res.url !== 'string') continue;

      // 1. URL Validation
      if (!validateUrl(res.url)) {
        continue;
      }

      try {
        // 2. URL Normalization
        const parsed = new URL(res.url);
        const cleanUrl = parsed.origin + parsed.pathname.replace(/\/$/, '');

        // 3. Deduplication
        if (seenUrls.has(cleanUrl)) {
          continue;
        }
        seenUrls.add(cleanUrl);

        // 4. Reject auth/login/irrelevant pages
        if (rejectPattern.test(parsed.pathname)) {
          continue;
        }

        // 5. Categorize Source Type
        let sourceType: FilteredResult['sourceType'] = 'public_web';
        const host = parsed.hostname.toLowerCase();

        if (host.includes('reddit.com')) sourceType = 'reddit';
        else if (host.includes('leetcode.com')) sourceType = 'leetcode';
        else if (host.includes('github.com')) sourceType = 'github';
        else if (host.includes('ycombinator.com') || host.includes('algolia.com')) sourceType = 'hackernews';
        else if (host.includes('geeksforgeeks.org') || host.includes('glassdoor.com') || host.includes('blind.com')) sourceType = 'forum';
        else if (host.includes('medium.com') || host.includes('dev.to') || host.includes('blog')) sourceType = 'blog';

        // 6. Accept valid result
        filtered.push({
          ...res,
          url: res.url,
          sourceType,
          status: 'success'
        });
      } catch {
        // Ignore invalid URL parse errors
      }
    }

    return filtered;
  }
}
