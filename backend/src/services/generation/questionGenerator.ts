import { z } from 'zod';
import { getLLMProvider } from '../llm/llmProvider.js';
import { Question, Flashcard, Requirement, QuestionSchema, FlashcardSchema } from '../validation/kitSchema.js';
import { config } from '../../config/env.js';

const QuestionsArraySchema = z.array(QuestionSchema);
const FlashcardsArraySchema = z.array(FlashcardSchema);

export class QuestionGenerator {
  static async generateInitialQuestionsAndFlashcards(
    roleTitle: string,
    requirements: Requirement[],
    companySummary: string
  ): Promise<{ questions: Question[]; flashcards: Flashcard[] }> {
    const provider = getLLMProvider();

    const systemPrompt = `You are a Principal Software Engineer and Technical Interview Panel Lead.
Your goal is to generate high-quality, authentic interview questions and flashcards for a ${roleTitle} position.

PRIMARY MANDATE:
1. Leverage the provided REAL-WORLD INTERVIEW DISCUSSIONS (sourced from LeetCode, Reddit, GitHub, and developer blogs).
2. Synthesize actual coding scenarios, algorithm patterns, system design challenges, and behavioral questions candidate loops actually encountered.
3. Every question MUST reference at least one valid requirement ID from the provided list (${requirements.map(r => r.id).join(', ')}).
4. Question categories MUST be one of: "technical" | "behavioural" | "system-design" | "company-fit".
5. Difficulty MUST be an integer: 1 (Easy/Foundational), 2 (Intermediate/Core), 3 (Hard/Advanced).
6. Every requirement marked as "must" priority should be addressed by at least one question.
7. Create matching flashcards for key technical concepts, algorithm patterns, and scenario outlines.`;

    const prompt = `Role: ${roleTitle}

Company Research & Real Candidate Interview Discussions:
${companySummary}

Requirements List:
${JSON.stringify(requirements, null, 2)}

Generate a JSON object containing:
1. "questions": Array of question objects with id (q1, q2...), requirement_ids, category, prompt, answer_outline, difficulty (1-3).
2. "flashcards": Array of flashcard objects with id (f1, f2...), front, back, requirement_ids.`;

    const combinedSchema = z.object({
      questions: QuestionsArraySchema,
      flashcards: FlashcardsArraySchema
    });

    try {
      const result = await provider.generateJSON(prompt, combinedSchema, systemPrompt);
      
      // Attach edit metadata
      const questions = result.questions.map((q, i) => ({
        ...q,
        id: `q${i + 1}`,
        difficulty: (Math.min(Math.max(q.difficulty, 1), 3)) as 1 | 2 | 3,
        _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
      }));

      const flashcards = result.flashcards.map((f, i) => ({
        ...f,
        id: `f${i + 1}`,
        _meta: { generated: true, edited: false, pinned: false }
      }));

      return { questions, flashcards };
    } catch (error: any) {
      console.warn('[QuestionGenerator Warning] LLM question generation failed. Generating fallback questions.', error.message);
      return this.fallbackQuestions(requirements);
    }
  }

  /**
   * SECOND PASS GAP-CLOSING: Generates missing questions specifically for uncovered must-have requirement IDs!
   */
  static async generateMissingQuestions(
    uncoveredReqs: Requirement[],
    existingQuestionsCount: number
  ): Promise<Question[]> {
    if (uncoveredReqs.length === 0) return [];

    const provider = getLLMProvider();
    const systemPrompt = `You are an Interview Panel Lead fixing requirement coverage gaps.
Generate targeted interview questions ONLY for the provided uncovered requirements.`;

    const prompt = `Uncovered Requirements:\n${JSON.stringify(uncoveredReqs, null, 2)}\n\nGenerate an array of Question objects targeting these exact requirement IDs. Starting ID should be q${existingQuestionsCount + 1}.`;

    try {
      const missingQuestions = await provider.generateJSON<Question[]>(prompt, QuestionsArraySchema, systemPrompt);
      return missingQuestions.map((q, i) => ({
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
        answer_outline: `1. Key concepts of ${req.text}\n2. Practical project example\n3. Best practices and tradeoffs`,
        difficulty: 2,
        _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
      }));
    }
  }

  private static fallbackQuestions(requirements: Requirement[]): { questions: Question[]; flashcards: Flashcard[] } {
    const questions: Question[] = [];
    const flashcards: Flashcard[] = [];

    requirements.forEach((req, idx) => {
      const qId = `q${idx + 1}`;
      const fId = `f${idx + 1}`;

      let cat: Question['category'] = 'technical';
      if (req.kind === 'behavioural') cat = 'behavioural';
      else if (req.text.toLowerCase().includes('architecture') || req.text.toLowerCase().includes('system')) cat = 'system-design';

      questions.push({
        id: qId,
        requirement_ids: [req.id],
        category: cat,
        prompt: `How do you apply ${req.text} in a production environment?`,
        answer_outline: `• Core principles of ${req.text}\n• Architecture considerations\n• Handling edge cases and error boundaries`,
        difficulty: (req.priority === 'must' ? 2 : 1) as 1 | 2 | 3,
        _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
      });

      flashcards.push({
        id: fId,
        requirement_ids: [req.id],
        front: `What are the core fundamentals of ${req.text}?`,
        back: `${req.text} involves standard industry patterns, efficient data handling, and clean code principles.`,
        confidence: 3,
        _meta: { generated: true, edited: false, pinned: false }
      });
    });

    return { questions, flashcards };
  }
}
