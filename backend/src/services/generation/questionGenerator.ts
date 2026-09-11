import { z } from 'zod';
import { getLLMProvider } from '../llm/llmProvider.js';
import { Question, Flashcard, Requirement, QuestionSchema, FlashcardSchema } from '../validation/kitSchema.js';
import { ExtractedInterviewEvidence } from '../research/discussions/discussionExtractor.js';

const QuestionsArraySchema = z.array(QuestionSchema);
const FlashcardsArraySchema = z.array(FlashcardSchema);

export class QuestionGenerator {
  /**
   * Deterministic Question Quality Filter (PART 8)
   * Rejects questions if:
   * - Contains raw navigation text / city names / location without context (e.g. "apply Hyderabad in production")
   * - Contains benefits or company perks
   * - Invalid requirement_ids
   */
  static validateQuestionQuality(question: Question, validReqIds: Set<string>): boolean {
    if (!question.prompt || question.prompt.length < 15) return false;
    if (!question.requirement_ids || question.requirement_ids.length === 0) return false;
    if (!question.requirement_ids.every(id => validReqIds.has(id))) return false;

    const promptLower = question.prompt.toLowerCase();

    // Reject generic nonsense / locations / benefits / raw navigation text
    const rejectRegex = /apply\s+(hyderabad|bangalore|london|seattle|new york|san francisco|chicago|remote|benefits|perks|company description|privacy policy|terms of service|login|signup)\s+in\s+a\s+production/i;
    if (rejectRegex.test(promptLower)) {
      return false;
    }

    // Reject city names used as technical tools
    if (/\b(hyderabad|bangalore|pune|mumbai|delhi|london|seattle)\b/i.test(promptLower) && !/location|relocation|office/i.test(promptLower)) {
      return false;
    }

    return true;
  }

  /**
   * PART 6 & 7: Question Generation with Evidence Hierarchy & Gemini 2.5 Flash
   */
  static async generateInitialQuestionsAndFlashcards(
    roleTitle: string,
    requirements: Requirement[],
    companySummary: string,
    evidences: ExtractedInterviewEvidence[] = []
  ): Promise<{ questions: Question[]; flashcards: Flashcard[] }> {
    const provider = getLLMProvider();
    const validReqIds = new Set(requirements.map(r => r.id));

    // Extract Level 1, 2 & 3 research evidence
    const reportedQuestions = evidences.flatMap(e => e.reported_questions || []);
    const reportedTopics = Array.from(new Set(evidences.flatMap(e => e.topics || [])));

    const systemPrompt = `You are a Principal Software Engineer and Technical Interview Lead.
Your goal is to generate authentic, high-quality interview questions and active recall flashcards for a ${roleTitle} role.

STRICT EVIDENCE HIERARCHY:
LEVEL 1: Actual reported interview questions from candidates (${reportedQuestions.length > 0 ? reportedQuestions.slice(0, 5).join('; ') : 'None'})
LEVEL 2: Reported interview topics + JD requirements (${reportedTopics.length > 0 ? reportedTopics.slice(0, 8).join(', ') : 'None'})
LEVEL 3: Company hiring & engineering culture + JD requirement
LEVEL 4: Extracted requirement text only

RULES:
1. Generate specific, technical, behavioural, and system-design questions for each requirement ID (${requirements.map(r => `${r.id}: ${r.text}`).join('; ')}).
2. DO NOT invent fake reported questions.
3. NEVER generate generic nonsense questions asking how to apply city names (e.g. "Hyderabad"), company benefits, or random UI text in production.
4. Every question MUST reference valid requirement IDs.
5. Difficulty MUST be integer 1 (Easy), 2 (Core), 3 (Hard).`;

    const prompt = `Role: ${roleTitle}

Company Research & Evidence:
${companySummary}

Target Requirements:
${JSON.stringify(requirements, null, 2)}

Generate JSON object containing "questions" and "flashcards".`;

    const combinedSchema = z.object({
      questions: QuestionsArraySchema,
      flashcards: FlashcardsArraySchema
    });

    try {
      const result = await provider.generateJSON(prompt, combinedSchema, systemPrompt);
      
      // Filter out low quality / invalid questions using Quality Filter
      const validQuestions = result.questions
        .filter(q => this.validateQuestionQuality(q, validReqIds))
        .map((q, i) => ({
          ...q,
          id: `q${i + 1}`,
          difficulty: (Math.min(Math.max(q.difficulty, 1), 3)) as 1 | 2 | 3,
          _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
        }));

      const validFlashcards = result.flashcards
        .filter(f => f.requirement_ids && f.requirement_ids.every(id => validReqIds.has(id)))
        .map((f, i) => ({
          ...f,
          id: `f${i + 1}`,
          _meta: { generated: true, edited: false, pinned: false }
        }));

      if (validQuestions.length === 0) {
        return this.fallbackQuestions(requirements);
      }

      return { questions: validQuestions, flashcards: validFlashcards };
    } catch (error: any) {
      console.warn('[QuestionGenerator Warning] LLM question generation failed. Generating fallback questions.', error.message);
      return this.fallbackQuestions(requirements);
    }
  }

  /**
   * SECOND PASS GAP-CLOSING: Generates missing questions specifically for uncovered requirement IDs
   */
  static async generateMissingQuestions(
    uncoveredReqs: Requirement[],
    existingQuestionsCount: number
  ): Promise<Question[]> {
    if (uncoveredReqs.length === 0) return [];

    const provider = getLLMProvider();
    const validReqIds = new Set(uncoveredReqs.map(r => r.id));

    const systemPrompt = `You are an Interview Panel Lead fixing requirement coverage gaps.
Generate targeted interview questions ONLY for the provided uncovered requirements.`;

    const prompt = `Uncovered Requirements:\n${JSON.stringify(uncoveredReqs, null, 2)}\n\nGenerate an array of Question objects targeting these exact requirement IDs. Starting ID should be q${existingQuestionsCount + 1}.`;

    try {
      const missingQuestions = await provider.generateJSON<Question[]>(prompt, QuestionsArraySchema, systemPrompt);
      return missingQuestions
        .filter(q => this.validateQuestionQuality(q, validReqIds))
        .map((q, i) => ({
          ...q,
          id: `q${existingQuestionsCount + i + 1}`,
          difficulty: (Math.min(Math.max(q.difficulty, 1), 3)) as 1 | 2 | 3,
          _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
        }));
    } catch (error: any) {
      console.warn('[QuestionGenerator Warning] LLM second-pass generation failed. Using fallback gap filler.', error.message);
      return uncoveredReqs.map((req, i) => ({
        id: `q${existingQuestionsCount + i + 1}`,
        requirement_ids: [req.id],
        category: req.kind === 'behavioural' ? 'behavioural' : 'technical',
        prompt: `Explain your experience and hands-on expertise with ${req.text}.`,
        answer_outline: `1. Core concepts of ${req.text}\n2. Practical project implementation\n3. Best practices and tradeoffs`,
        difficulty: 2,
        _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
      }));
    }
  }

  private static fallbackQuestions(requirements: Requirement[]): { questions: Question[]; flashcards: Flashcard[] } {
    const questions: Question[] = [];
    const flashcards: Flashcard[] = [];

    // Filter out non-skill requirement stubs (like "Hyderabad", "internship stipend", etc.)
    const skillReqs = requirements.filter(r => !/location|city|hyderabad|stipend|perks|benefits|bonus/i.test(r.text));
    const targetList = skillReqs.length > 0 ? skillReqs : requirements;

    targetList.forEach((req, idx) => {
      const qId = `q${idx + 1}`;
      const fId = `f${idx + 1}`;

      let cat: Question['category'] = 'technical';
      if (req.kind === 'behavioural') cat = 'behavioural';
      else if (req.text.toLowerCase().includes('architecture') || req.text.toLowerCase().includes('system')) cat = 'system-design';

      questions.push({
        id: qId,
        requirement_ids: [req.id],
        category: cat,
        prompt: `Explain your practical experience and engineering approach when working with ${req.text}.`,
        answer_outline: `• Core principles of ${req.text}\n• Architecture considerations & production design\n• Error handling, optimization, and tradeoffs`,
        difficulty: (req.priority === 'must' ? 2 : 1) as 1 | 2 | 3,
        _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
      });

      flashcards.push({
        id: fId,
        requirement_ids: [req.id],
        front: `What are the key technical concepts behind ${req.text}?`,
        back: `${req.text} involves standard software engineering patterns, efficient algorithms, and robust system architecture.`,
        confidence: 3,
        _meta: { generated: true, edited: false, pinned: false }
      });
    });

    return { questions, flashcards };
  }
}
