import { z } from 'zod';
import { getLLMProvider } from '../llm/llmProvider.js';
import { Role, RoleSchema } from '../validation/kitSchema.js';
import { config } from '../../config/env.js';

export class JDExtractor {
  static async extractRoleFromJD(jdText: string): Promise<Role> {
    const provider = getLLMProvider();

    const systemPrompt = `You are a expert Technical Recruiter and Job Description Parser.
Extract key information from the provided job description into JSON format matching this structure:
{
  "title": string,
  "seniority": string,
  "responsibilities": string[],
  "requirements": [
    {
      "id": "r1",
      "text": "Exact text description of the requirement",
      "kind": "technical" | "behavioural" | "domain",
      "priority": "must" | "nice"
    }
  ]
}

RULES:
1. Do NOT invent or extrapolate requirements that are not in the job description. A 2-line JD should result in a minimal set of requirements.
2. Every requirement must have a stable ID starting with "r1", "r2", etc.
3. Every requirement text must be in the "text" property (NOT "description" or "requirement").
4. Priority must be "must" (essential/required) or "nice" (optional/preferred).`;

    const prompt = `Job Description Text:\n"""\n${jdText}\n"""\n\nExtract and return the Role object with title, seniority, responsibilities array, and requirements array.`;

    try {
      const extractedRole = await provider.generateJSON<Role>(prompt, RoleSchema, systemPrompt);
      // Ensure stable sequential IDs r1, r2, r3...
      extractedRole.requirements.forEach((req, idx) => {
        req.id = `r${idx + 1}`;
      });
      return extractedRole;
    } catch (error: any) {
      console.warn('[JDExtractor Warning] LLM extraction failed. Using fallback deterministic parser.', error.message);
      return this.fallbackExtract(jdText);
    }
  }

  private static fallbackExtract(jdText: string): Role {
    const lines = jdText.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines[0] || 'Software Engineer';
    const seniority = /senior|lead|principal|staff/i.test(jdText)
      ? 'Senior'
      : /junior|associate|intern/i.test(jdText)
      ? 'Junior'
      : 'Mid-Level';

    const requirements: Role['requirements'] = [];
    let reqIndex = 1;

    for (const line of lines) {
      if (line.length < 5 || line.length > 200) continue;
      const isNice = /nice|bonus|plus|preferred|optional/i.test(line);
      const isBehavioral = /leadership|communication|mentor|teamwork|collaborate/i.test(line);
      const isDomain = /fintech|healthcare|ecommerce|saas|compliance|security/i.test(line);

      requirements.push({
        id: `r${reqIndex++}`,
        text: line.replace(/^[-*•\d.]+\s*/, ''),
        kind: isBehavioral ? 'behavioural' : isDomain ? 'domain' : 'technical',
        priority: isNice ? 'nice' : 'must'
      });
    }

    if (requirements.length === 0) {
      requirements.push({
        id: 'r1',
        text: 'General software development skills described in posting',
        kind: 'technical',
        priority: 'must'
      });
    }

    return {
      title,
      seniority,
      responsibilities: lines.slice(1, 4),
      requirements
    };
  }
}
