import { tavily } from '@tavily/core';
import { SearchProvider, SearchOptions, SearchResult } from './searchProvider.js';
import { config } from '../../../config/env.js';

export class TavilySearchProvider implements SearchProvider {
  private client: ReturnType<typeof tavily> | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || config.tavilyApiKey;
    if (key) {
      this.client = tavily({ apiKey: key });
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.client) {
      console.warn('[TavilySearchProvider] No TAVILY_API_KEY available. Skipping Tavily search.');
      return [];
    }

    try {
      const response = await this.client.search(query, {
        maxResults: options.maxResults || 6,
        includeDomains: options.includeDomains,
        excludeDomains: options.excludeDomains,
        searchDepth: 'advanced'
      });

      if (!response.results || !Array.isArray(response.results)) {
        return [];
      }

      return response.results.map((res: any) => ({
        title: res.title || 'Public Discussion',
        url: res.url,
        content: res.content || res.rawContent || '',
        score: res.score || 80,
        domain: new URL(res.url).hostname.replace(/^www\./, ''),
        publishedDate: res.publishedDate
      }));
    } catch (err: any) {
      console.warn(`[TavilySearchProvider Warning] Search failed for "${query}": ${err.message}`);
      return [];
    }
  }
}
