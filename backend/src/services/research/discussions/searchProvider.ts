export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  domain?: string;
  publishedDate?: string;
}

export interface SearchOptions {
  includeDomains?: string[];
  excludeDomains?: string[];
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
}

export interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
