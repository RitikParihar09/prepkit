import { getLLMProvider } from '../llm/llmProvider.js';
import { CompanyBrief, CompanyBriefSchema } from '../validation/kitSchema.js';
import { ResearchResult } from '../research/companyCrawler.js';
import { config } from '../../config/env.js';

export class BriefGenerator {
  static async generateBrief(companyUrl: string, research: ResearchResult): Promise<CompanyBrief> {
    const provider = getLLMProvider();

    if (research.error || research.pages.length === 0) {
      return {
        summary: `No public company website content could be retrieved from ${companyUrl}.`,
        what_they_do: 'No reliable company information was found.',
        sources: []
      };
    }

    const systemPrompt = `You are a corporate intelligence analyst creating a succinct company brief for an interview prep kit.
RULES:
1. Base your brief strictly on the provided website research content.
2. If no hiring or interview information was discovered, explicitly state in the summary or what_they_do: "No reliable hiring information was found."
3. Do NOT fabricate information not present in the research text.`;

    const prompt = `Company URL: ${companyUrl}
Research Pages Content:\n"""\n${research.summaryText.substring(0, 15000)}\n"""

Generate and return a CompanyBrief JSON object with:
- summary: (2-3 sentences overview)
- what_they_do: (Core products, services, or business model)
- sources: (Array of source page URLs used, e.g. [ "${research.pagesUsed.join('", "')}" ])`;

    try {
      const brief = await provider.generateJSON<CompanyBrief>(prompt, CompanyBriefSchema, systemPrompt);
      brief.sources = research.pagesUsed;
      return brief;
    } catch (error: any) {
      console.warn('[BriefGenerator Warning] LLM brief generation failed. Using fallback brief parser.', error.message);
      return {
        summary: research.hasHiringInfo
          ? `Overview of ${research.companyNameGuess || 'the company'} derived from public pages.`
          : `No reliable hiring information was found for ${companyUrl}.`,
        what_they_do: research.pages[0]?.text.substring(0, 250) || 'Company details not publicly available.',
        sources: research.pagesUsed
      };
    }
  }
}
