import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { config } from '../../config/env.js';

export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
  score: number;
}

export interface ResearchResult {
  companyUrl: string;
  companyNameGuess: string;
  pages: ScrapedPage[];
  pagesUsed: string[];
  summaryText: string;
  hasHiringInfo: boolean;
  publicDiscussionFound: boolean;
  error?: string;
}

const HIGH_PRIORITY_KEYWORDS = [
  'interview-process',
  'interview-questions',
  'interview-loop',
  'interview',
  'take-home',
  'system-design',
  'hiring-process',
  'engineering-blog',
  'tech-blog',
  'hiring',
  'career',
  'careers',
  'jobs',
  'job',
  'engineering',
  'handbook',
  'culture',
  'recruiting',
  'work-at',
  'join-us',
  'values',
  'team',
  'discussion'
];

/**
 * Validates a URL against SSRF attacks while allowing local URLs in evaluator/testing mode.
 */
export function validateUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // If local test URLs are explicitly allowed (e.g. evaluator mode), pass local addresses
    if (config.allowLocalUrls) {
      return true;
    }

    // SSRF Protections for Production: Block localhost, loopback, and private IPv4/IPv6 ranges
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0'
    ) {
      return false;
    }

    // Private IPv4 ranges
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function extractCompanyName(companyUrl: string, textOrJd?: string): string {
  if (!companyUrl) return 'Company';

  try {
    const formattedUrl = companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`;
    const parsed = new URL(formattedUrl);
    const hostParts = parsed.hostname.replace(/^www\./, '').split('.');
    
    // Ignore common generic subdomain prefixes
    const ignoreSubdomains = new Set(['jobs', 'careers', 'work', 'web', 'app', 'www', 'about', 'join', 'in', 'uk', 'us', 'eu']);
    
    let mainDomain = hostParts[0];
    if (ignoreSubdomains.has(mainDomain.toLowerCase()) && hostParts.length > 1) {
      mainDomain = hostParts[1];
    }
    
    if (mainDomain && mainDomain.length > 1) {
      const formattedDomain = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
      
      if (!['Github', 'Linkedin', 'Medium', 'Notion', 'Glassdoor', 'Substack'].includes(formattedDomain)) {
        if (textOrJd) {
          const regex = new RegExp(`\\b(${mainDomain})\\b`, 'i');
          const match = textOrJd.match(regex);
          if (match && match[0]) {
            return match[0].charAt(0).toUpperCase() + match[0].slice(1);
          }
        }
        return formattedDomain;
      }
    }
  } catch {
    // Ignore URL parse errors
  }

  if (textOrJd) {
    const jdPatterns = [
      /\b(?:at|for|join|building|team at)\s+([A-Z][a-zA-Z0-9\&\.\-]{2,20})\b/,
      /About\s+([A-Z][a-zA-Z0-9\&\.\-]{2,20})[:\s]/,
      /([A-Z][a-zA-Z0-9\&\.\-]{2,20})\s+is\s+(?:hiring|looking|seeking)/,
      /Welcome to\s+([A-Z][a-zA-Z0-9\&\.\-]{2,20})/
    ];

    for (const pat of jdPatterns) {
      const match = textOrJd.match(pat);
      if (match && match[1] && !['the', 'our', 'a', 'an', 'this', 'senior', 'junior', 'lead', 'full', 'software', 'engineer'].includes(match[1].toLowerCase())) {
        return match[1];
      }
    }
  }

  return 'Company';
}

export class CompanyCrawler {
  /**
   * Scores a hyperlink candidate based on its URL, anchor text, and title
   */
  static scoreLink(href: string, anchorText: string, title: string = ''): number {
    const textToScore = `${href} ${anchorText} ${title}`.toLowerCase();
    let score = 0;

    for (const kw of HIGH_PRIORITY_KEYWORDS) {
      if (textToScore.includes(kw)) {
        if (
          kw === 'interview' || 
          kw === 'interview-process' || 
          kw === 'take-home' || 
          kw === 'system-design' ||
          kw === 'hiring' || 
          kw === 'handbook' || 
          kw === 'engineering'
        ) {
          score += 25;
        } else {
          score += 10;
        }
      }
    }
    return score;
  }

  /**
   * Checks target URL against domain robots.txt Disallow rules
   */
  static async isPathAllowedByRobots(targetUrl: string): Promise<boolean> {
    try {
      const parsed = new URL(targetUrl);
      const robotsUrl = `${parsed.origin}/robots.txt`;
      const res = await axios.get(robotsUrl, { timeout: 3000, headers: { 'User-Agent': 'TraoPrepKitBot/1.0 (+https://trao.io)' } });
      if (!res.data || typeof res.data !== 'string') return true;

      const pathname = parsed.pathname.toLowerCase();
      const lines = res.data.split('\n');
      let isUserAgentMatch = true;

      for (const line of lines) {
        const clean = line.trim();
        if (clean.toLowerCase().startsWith('user-agent:')) {
          const ua = clean.split(':')[1].trim();
          isUserAgentMatch = ua === '*' || ua.toLowerCase().includes('traoprepkitbot');
        } else if (isUserAgentMatch && clean.toLowerCase().startsWith('disallow:')) {
          const disallowPath = clean.split(':')[1].trim().toLowerCase();
          if (disallowPath && disallowPath !== '/' && pathname.startsWith(disallowPath)) {
            return false;
          }
        }
      }
      return true;
    } catch {
      // If robots.txt fails or 404s, allow crawling politely
      return true;
    }
  }
  private static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetches a single page with polite rate limiting and exponential backoff retry on HTTP 429 / 5xx
   */
  static async fetchPageWithBackoff(url: string, retries: number = 2, baseDelayMs: number = 300): Promise<{ html: string; error?: string }> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffTime = baseDelayMs * Math.pow(2, attempt - 1);
          await this.sleep(backoffTime);
        }

        const res = await axios.get(url, {
          timeout: 6000,
          maxContentLength: 2 * 1024 * 1024,
          headers: { 'User-Agent': 'TraoPrepKitBot/1.0 (+https://trao.io)' }
        });

        return { html: res.data };
      } catch (err: any) {
        const isRateLimit = err?.response?.status === 429 || err?.response?.status === 503;
        if (isRateLimit && attempt < retries) {
          console.warn(`[Crawler Rate-Limit] 429/503 received for ${url}. Retrying attempt ${attempt + 1} with exponential backoff...`);
          continue;
        }
        return { html: '', error: err.message || 'Page request failed' };
      }
    }
    return { html: '', error: 'Max retries exceeded' };
  }

  /**
   * Cleans HTML content, extracting plain text content safely
   */
  static cleanHtml(html: string): { title: string; text: string } {
    if (!html) return { title: 'Empty Page', text: '' };
    const $ = cheerio.load(html);
    // Remove irrelevant tags
    $('script, style, noscript, svg, nav, footer, header, iframe').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';
    
    // Get text content, remove excess whitespace
    let text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();

    // Sanitize prompt injection markers if any
    text = text.replace(/<\|endoftext\|>/g, '');

    return { title, text: text.substring(0, 10000) }; // Cap per-page text at 10KB
  }
  static async searchPublicDeveloperDiscussions(companyName: string): Promise<ScrapedPage[]> {
    if (!companyName || companyName.length < 2 || companyName.toLowerCase() === 'localhost') return [];

    const scrapedDiscussions: ScrapedPage[] = [];

    // 1. Query Reddit Global Search API (Zero-Key API with Custom Browser User-Agent)
    try {
      const redditSearchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(companyName + ' interview questions')}&limit=5&sort=relevance`;
      const redditRes = await axios.get(redditSearchUrl, {
        timeout: 6000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });

      if (redditRes.data?.data?.children?.length > 0) {
        const posts = redditRes.data.data.children;
        const items: string[] = [];

        for (const post of posts) {
          const title = post.data?.title;
          const selftext = post.data?.selftext || '';
          const permalink = post.data?.permalink ? `https://www.reddit.com${post.data.permalink}` : '';
          if (title) {
            const cleanText = selftext.substring(0, 250).replace(/\s+/g, ' ');
            items.push(`• ${title}${cleanText ? `: ${cleanText}` : ''} (${permalink})`);
          }
        }

        if (items.length > 0) {
          scrapedDiscussions.push({
            url: `https://www.reddit.com/search/?q=${encodeURIComponent(companyName + ' interview questions')}`,
            title: `[REDDIT DEVELOPER DISCUSSIONS] ${companyName} Interview Experiences`,
            text: `Public Developer Interview Experiences (${companyName}):\n${items.join('\n')}`,
            score: 95
          });
        }
      }
    } catch (err: any) {
      console.warn(`[Crawler Warning] Reddit JSON search failed for ${companyName}: ${err.message}`);
    }

    // 2. Query GitHub Public Interview Repositories Search API
    try {
      const ghSearchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(companyName + ' interview questions')}&per_page=4`;
      const ghRes = await axios.get(ghSearchUrl, {
        timeout: 6000,
        headers: {
          'User-Agent': 'TraoPrepKitBot/1.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (ghRes.data?.items?.length > 0) {
        const repos = ghRes.data.items;
        const items: string[] = repos.map((repo: any) => 
          `• ${repo.full_name}: ${repo.description || 'Public technical interview questions & preparation notes'} (${repo.html_url})`
        );

        scrapedDiscussions.push({
          url: `https://github.com/search?q=${encodeURIComponent(companyName + ' interview questions')}`,
          title: `[GITHUB INTERVIEW REPOS] Public ${companyName} Question Sets & Experiences`,
          text: `Public GitHub Interview Question Repositories (${companyName}):\n${items.join('\n')}`,
          score: 90
        });
      }
    } catch (err: any) {
      console.warn(`[Crawler Warning] GitHub Search API failed for ${companyName}: ${err.message}`);
    }

    // 3. Query HackerNews Algolia Search API
    try {
      const hnSearchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(companyName + ' interview')}&tags=story&hitsPerPage=4`;
      const hnRes = await axios.get(hnSearchUrl, { timeout: 5000 });

      if (hnRes.data?.hits?.length > 0) {
        const hits = hnRes.data.hits;
        const items: string[] = hits.map((hit: any) => 
          `• ${hit.title} (${hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`})`
        );

        scrapedDiscussions.push({
          url: `https://hn.algolia.com/?query=${encodeURIComponent(companyName + ' interview')}`,
          title: `[HACKERNEWS DISCUSSIONS] ${companyName} Engineering & Hiring Posts`,
          text: `HackerNews Discussions & Hiring Threads (${companyName}):\n${items.join('\n')}`,
          score: 85
        });
      }
    } catch (err: any) {
      console.warn(`[Crawler Warning] HackerNews Algolia Search failed for ${companyName}: ${err.message}`);
    }

    return scrapedDiscussions;
  }

  /**
   * Main crawl entry point for a company website and public interview discussion
   */
  static async researchCompany(companyUrl: string, onLog?: (msg: string, url?: string) => void): Promise<ResearchResult> {
    const result: ResearchResult = {
      companyUrl,
      companyNameGuess: extractCompanyName(companyUrl),
      pages: [],
      pagesUsed: [],
      summaryText: '',
      hasHiringInfo: false,
      publicDiscussionFound: false
    };

    if (!validateUrl(companyUrl)) {
      result.error = `INVALID_URL: The provided company URL "${companyUrl}" is invalid or restricted by security policy.`;
      onLog?.(`Security check failed: ${companyUrl} is invalid or restricted.`);
      return result;
    }

    try {
      onLog?.(`Connecting to company website: ${companyUrl}`, companyUrl);
      // 1. Fetch Homepage
      const homepageRes = await axios.get(companyUrl, {
        timeout: 8000,
        maxContentLength: 2 * 1024 * 1024, // 2MB
        headers: { 'User-Agent': 'TraoPrepKitBot/1.0 (+https://trao.io)' }
      });

      const baseUrlParsed = new URL(companyUrl);
      result.companyNameGuess = baseUrlParsed.hostname.replace(/^www\./, '').split('.')[0];
      const homepageData = this.cleanHtml(homepageRes.data);
      
      result.pages.push({
        url: companyUrl,
        title: homepageData.title,
        text: homepageData.text,
        score: 100
      });
      result.pagesUsed.push(companyUrl);
      onLog?.(`Fetched homepage (${homepageData.title || result.companyNameGuess}) - ${homepageData.text.length} chars extracted`, companyUrl);

      // 2. Discover & Rank Internal Links (Strict Hiring & Culture Filter)
      const $ = cheerio.load(homepageRes.data);
      const linkCandidates: { url: string; score: number; anchorText: string }[] = [];
      const seenUrls = new Set<string>([companyUrl]);

      // Marketing/Noise patterns to discard
      const noiseRegex = /\/news|\/media|\/press|\/store|\/privacy|\/terms|\/legal|\/cart|\/shop|\/cookie|\/login|\/signup/i;

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const anchorText = $(el).text().trim();
        const titleAttr = $(el).attr('title') || '';

        if (!href) return;

        try {
          // Resolve relative URL
          const resolved = new URL(href, companyUrl);
          
          // Support relative URLs & subdomains (e.g. careers.ea.com, jobs.company.com, engineering.company.com)
          const targetRootDomain = baseUrlParsed.hostname.replace(/^www\./, '').split('.').slice(-2).join('.');
          const resolvedRootDomain = resolved.hostname.replace(/^www\./, '').split('.').slice(-2).join('.');

          if (resolvedRootDomain === targetRootDomain) {
            const cleanUrl = resolved.origin + resolved.pathname;
            if (!seenUrls.has(cleanUrl) && !noiseRegex.test(resolved.pathname)) {
              seenUrls.add(cleanUrl);
              const score = this.scoreLink(resolved.pathname, anchorText, titleAttr);
              if (score > 0) {
                linkCandidates.push({ url: cleanUrl, score, anchorText });
              }
            }
          }
        } catch {
          // Ignore invalid link URLs
        }
      });

      // If candidate links have low scores, add standard high-value path fallbacks (e.g. /about, /engineering, /team, /careers)
      if (linkCandidates.length < 5) {
        const standardPaths = ['/careers', '/jobs', '/about', '/engineering', '/culture', '/team'];
        for (const p of standardPaths) {
          const full = baseUrlParsed.origin + p;
          if (!seenUrls.has(full)) {
            seenUrls.add(full);
            linkCandidates.push({ url: full, score: 15, anchorText: p });
          }
        }
      }

      // Sort candidate links by score descending
      linkCandidates.sort((a, b) => b.score - a.score);
      onLog?.(`Discovered ${linkCandidates.length} engineering & hiring page candidates on ${baseUrlParsed.hostname}`);

      // 3. Fetch Top 6 Promising Subpages with rate limiting, backoff & robots.txt compliance
      const topCandidates = linkCandidates.slice(0, 6);
      for (const candidate of topCandidates) {
        // Rate-limiting delay between subpage requests
        await this.sleep(250);

        // Respect robots.txt Disallow rules
        const allowedByRobots = await this.isPathAllowedByRobots(candidate.url);
        if (!allowedByRobots) {
          console.warn(`[Crawler Robots.txt] Skipping disallowed source ${candidate.url}`);
          continue;
        }

        onLog?.(`Crawling target subpage: ${candidate.url}`, candidate.url);
        const { html, error: fetchErr } = await this.fetchPageWithBackoff(candidate.url, 2, 300);
        if (fetchErr) {
          console.warn(`[Crawler Warning] Skipping unretrievable source ${candidate.url}: ${fetchErr}`);
          continue;
        }

        const pageData = this.cleanHtml(html);
        if (pageData.text.length > 50) {
          result.pages.push({
            url: candidate.url,
            title: pageData.title,
            text: pageData.text,
            score: candidate.score
          });
          result.pagesUsed.push(candidate.url);
          onLog?.(`Scraped page content: "${pageData.title}" (${candidate.url})`, candidate.url);
        }
      }

      // 4. Search Public Discussion Portals (LeetCode, Reddit, GitHub) for Real Interview Questions
      const companyForSearch = result.companyNameGuess && result.companyNameGuess !== 'localhost' 
        ? result.companyNameGuess 
        : 'Tech Company';

      const discussionPages = await this.searchPublicDeveloperDiscussions(companyForSearch);
      if (discussionPages.length > 0) {
        result.pages.push(...discussionPages);
        discussionPages.forEach(dp => result.pagesUsed.push(dp.url));
        result.publicDiscussionFound = true;
      }

      // 5. Compile Combined Summary
      const combinedText = result.pages.map(p => `--- PAGE: ${p.title} (${p.url}) ---\n${p.text}`).join('\n\n');
      result.summaryText = combinedText.substring(0, 25000); // Cap total text

      // Check if hiring / interview culture information was found
      result.hasHiringInfo = result.pages.some(p => 
        p.score >= 10 || 
        /hiring|interview|engineering|careers|jobs|values|culture|take-home|system design/i.test(p.text)
      );

      return result;
    } catch (error: any) {
      console.warn(`[Crawler Warning] Company site fetch failed for ${companyUrl}: ${error.message}`);
      
      // Fallback: even if company website fails/unreachable, attempt public developer discussion search
      const fallbackName = validateUrl(companyUrl) ? new URL(companyUrl).hostname.replace(/^www\./, '').split('.')[0] : 'Tech Company';
      const discussionPages = await this.searchPublicDeveloperDiscussions(fallbackName);
      
      if (discussionPages.length > 0) {
        result.pages.push(...discussionPages);
        discussionPages.forEach(dp => result.pagesUsed.push(dp.url));
        result.publicDiscussionFound = true;
        result.summaryText = discussionPages.map(p => `--- PAGE: ${p.title} (${p.url}) ---\n${p.text}`).join('\n\n');
        result.hasHiringInfo = true;
        return result;
      }

      result.error = `COMPANY_UNREACHABLE: Site unreachable or returned error (${error.message}).`;
      return result;
    }
  }
}
