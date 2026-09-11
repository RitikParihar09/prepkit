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
   * Cleans HTML content, extracting plain text content safely
   */
  static cleanHtml(html: string): { title: string; text: string } {
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

  /**
   * Searches public web discussion portals (LeetCode Discuss, Reddit, GitHub, Developer Forums)
   * for actual interview questions asked by the company.
   */
  static async searchPublicDeveloperDiscussions(companyName: string): Promise<ScrapedPage[]> {
    if (!companyName || companyName.length < 2) return [];

    const scrapedDiscussions: ScrapedPage[] = [];
    const searchTargets = [
      {
        source: 'LeetCode & Coding Portals',
        query: `site:leetcode.com/discuss "${companyName}" interview questions asked`,
        score: 95
      },
      {
        source: 'Reddit & Tech Forums',
        query: `site:reddit.com "${companyName}" interview questions asked technical round`,
        score: 90
      },
      {
        source: 'Developer Blogs & Experience Logs',
        query: `"${companyName}" software engineer interview experience questions asked`,
        score: 85
      }
    ];

    for (const target of searchTargets) {
      try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(target.query)}`;
        const searchRes = await axios.get(searchUrl, {
          timeout: 6000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        const $ = cheerio.load(searchRes.data);
        const items: string[] = [];

        $('.result__body').each((_, el) => {
          const title = $(el).find('.result__title').text().trim();
          const snippet = $(el).find('.result__snippet').text().trim();

          if (snippet && snippet.length > 25) {
            items.push(`${title}: ${snippet}`);
          }
        });

        if (items.length > 0) {
          const combinedText = items.slice(0, 4).join('\n• ');
          scrapedDiscussions.push({
            url: `https://duckduckgo.com/?q=${encodeURIComponent(target.query)}`,
            title: `[REAL INTERVIEW DISCUSSIONS] ${target.source} - ${companyName}`,
            text: `Public Discussion Excerpts (${target.source}):\n• ${combinedText}`,
            score: target.score
          });
        }
      } catch (err: any) {
        console.warn(`[Crawler Warning] Developer discussion search failed for ${target.source} (${companyName}): ${err.message}`);
      }
    }

    return scrapedDiscussions;
  }

  /**
   * Main crawl entry point for a company website and public interview discussion
   */
  static async researchCompany(companyUrl: string): Promise<ResearchResult> {
    const result: ResearchResult = {
      companyUrl,
      companyNameGuess: '',
      pages: [],
      pagesUsed: [],
      summaryText: '',
      hasHiringInfo: false,
      publicDiscussionFound: false
    };

    if (!validateUrl(companyUrl)) {
      result.error = `INVALID_URL: The provided company URL "${companyUrl}" is invalid or restricted by security policy.`;
      return result;
    }

    try {
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

      // 2. Discover & Rank Internal Links
      const $ = cheerio.load(homepageRes.data);
      const linkCandidates: { url: string; score: number; anchorText: string }[] = [];
      const seenUrls = new Set<string>([companyUrl]);

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const anchorText = $(el).text().trim();
        const titleAttr = $(el).attr('title') || '';

        if (!href) return;

        try {
          // Resolve relative URL
          const resolved = new URL(href, companyUrl);
          
          // Ensure link stays within company domain
          if (resolved.hostname === baseUrlParsed.hostname) {
            const cleanUrl = resolved.origin + resolved.pathname;
            if (!seenUrls.has(cleanUrl)) {
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

      // Sort candidate links by score descending
      linkCandidates.sort((a, b) => b.score - a.score);

      // 3. Fetch Top 3 Promising Subpages (e.g. /careers, /jobs, handbook, engineering blog)
      const topCandidates = linkCandidates.slice(0, 3);
      for (const candidate of topCandidates) {
        try {
          const pageRes = await axios.get(candidate.url, {
            timeout: 6000,
            maxContentLength: 2 * 1024 * 1024,
            headers: { 'User-Agent': 'TraoPrepKitBot/1.0 (+https://trao.io)' }
          });
          const pageData = this.cleanHtml(pageRes.data);
          result.pages.push({
            url: candidate.url,
            title: pageData.title,
            text: pageData.text,
            score: candidate.score
          });
          result.pagesUsed.push(candidate.url);
        } catch (pageError: any) {
          console.warn(`[Crawler Warning] Failed to fetch subpage ${candidate.url}: ${pageError.message}`);
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
