import { z } from 'zod';
import { getLLMProvider } from '../llm/llmProvider.js';
import { Question, Flashcard, Requirement } from '../validation/kitSchema.js';
import { ExtractedInterviewEvidence } from '../research/discussions/discussionExtractor.js';

// Flexible schema for raw LLM JSON parsing before ID normalization
const FlexibleQuestionSchema = z.object({
  id: z.string().optional(),
  requirement_ids: z.array(z.string()).optional(),
  category: z.enum(['technical', 'behavioural', 'system-design', 'company-fit']).catch('technical'),
  prompt: z.string().min(5),
  answer_outline: z.union([z.string(), z.array(z.string())]).transform(val => (Array.isArray(val) ? val.join('\n• ') : val)),
  difficulty: z.number().catch(2)
});

const FlexibleFlashcardSchema = z.object({
  id: z.string().optional(),
  front: z.string().min(5),
  back: z.string().min(5),
  requirement_ids: z.array(z.string()).optional(),
  confidence: z.number().optional()
});

const CombinedGenerationSchema = z.object({
  questions: z.array(FlexibleQuestionSchema),
  flashcards: z.array(FlexibleFlashcardSchema)
});

export class QuestionGenerator {
  /**
   * Deterministic Question Quality Filter
   * Rejects questions if:
   * - Contains raw navigation text / city names / location without context (e.g. "apply Hyderabad in production")
   * - Contains benefits or company perks
   */
  static validateQuestionQuality(promptText: string): boolean {
    if (!promptText || promptText.length < 15) return false;

    const promptLower = promptText.toLowerCase();

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
   * Generates authentic, high-quality interview questions and active-recall flashcards derived from web research & JD requirements.
   * Adjusts scale and depth dynamically based on user's available preparation timeline (daysAvailable).
   */
  static async generateInitialQuestionsAndFlashcards(
    roleTitle: string,
    requirements: Requirement[],
    companySummary: string,
    evidences: ExtractedInterviewEvidence[] = [],
    daysAvailable: number = 7
  ): Promise<{ questions: Question[]; flashcards: Flashcard[] }> {
    const provider = getLLMProvider();
    const validReqIds = requirements.map(r => r.id);

    // Extract reported interview evidence details
    const reportedQuestions = evidences.flatMap(e => e.reported_questions || []);
    const reportedTopics = Array.from(new Set(evidences.flatMap(e => e.topics || [])));

    // Dynamic strategy based on preparation window:
    // Short Sprint (1-3 days): 8-12 high-priority core questions & 10 flashcards.
    // Standard Sprint (4-7 days): 16-24 questions & 20 flashcards (~3 questions per day).
    // Extended Sprint (8-14 days): 24-36 questions & 30 flashcards (~2-3 questions per day).
    // Mastery Roadmap (15-60 days): 35-50 extensive questions & 40 flashcards covering all core + nice-to-have topics.
    let questionTargetCount = 18;
    let flashcardTargetCount = 20;
    let focusInstructions = '';

    if (daysAvailable <= 3) {
      questionTargetCount = Math.min(Math.max(requirements.length * 2, 8), 12);
      flashcardTargetCount = 10;
      focusInstructions = `CRITICAL SHORT SPRINT FOCUS (Student has only ${daysAvailable} days!):
- Focus STRICTLY on the MOST CRITICAL "must-have" requirements and highest-yield interview topics.
- Keep questions laser-focused on core practical concepts, essential system design tradeoffs, and top high-frequency interview scenarios.
- Skip obscure edge cases to allow ultra-fast high-impact preparation.
- Generate EXACTLY ~${questionTargetCount} questions and ~${flashcardTargetCount} flashcards.`;
    } else if (daysAvailable <= 7) {
      questionTargetCount = Math.min(Math.max(requirements.length * 3, 16), 24);
      flashcardTargetCount = 20;
      focusInstructions = `STANDARD PREPARATION SPRINT (Student has ${daysAvailable} days available):
- Balanced coverage across technical deep-dives, system design architecture, and behavioural STAR scenarios.
- Provide ~3 high-quality practice questions per day to build comprehensive mastery.
- Generate EXACTLY ~${questionTargetCount} questions and ~${flashcardTargetCount} flashcards.`;
    } else if (daysAvailable <= 14) {
      questionTargetCount = Math.min(Math.max(requirements.length * 4, 24), 36);
      flashcardTargetCount = 30;
      focusInstructions = `EXTENDED PREPARATION SPRINT (Student has ${daysAvailable} days available):
- Comprehensive multi-category question bank across Technical, System Design, Behavioral, and Company-Fit questions.
- Provide a robust progression across difficulty levels 1, 2, and 3.
- Generate EXACTLY ~${questionTargetCount} questions and ~${flashcardTargetCount} flashcards.`;
    } else {
      questionTargetCount = Math.min(Math.max(requirements.length * 5, 32), 48);
      flashcardTargetCount = 40;
      focusInstructions = `MASTERY ROADMAP PREPARATION FOCUS (Student has ${daysAvailable} days available for comprehensive prep):
- Exhaustive, end-to-end question bank covering all core AND nice-to-have requirements in detail.
- Include deep multi-step architecture scenarios, edge-case production debugging, and advanced domain questions.
- Generate EXACTLY ~${questionTargetCount} questions and ~${flashcardTargetCount} flashcards.`;
    }

    const systemPrompt = `You are a Senior Principal Engineer and Hiring Committee Lead.
Your task is to generate authentic, highly targeted technical and behavioural interview questions and active-recall flashcards for a ${roleTitle} role.

PREPARATION TIMELINE STRATEGY:
${focusInstructions}

RULES FOR QUESTIONS & FLASHCARDS:
1. Every question must be a realistic, scenario-based or technical deep-dive interview question (e.g., system design tradeoffs, production debugging, architecture decisions, behavioural STAR scenarios).
2. DO NOT write generic template strings like "Explain your experience with [Requirement]". Formulate natural, realistic interview questions.
3. Incorporate actual candidate reported interview topics if available: (${reportedTopics.slice(0, 8).join(', ') || 'General Engineering'}).
4. Match questions to valid requirement IDs: ${validReqIds.join(', ')}.
5. Every flashcard must be an active recall prompt ("front") with a clear, concise technical solution/explanation ("back").`;

    const prompt = `Role: ${roleTitle}
Days Available for Prep: ${daysAvailable} days

Target Company Context:
${companySummary}

Target Requirements to Cover:
${JSON.stringify(requirements, null, 2)}

Candidate Reported Discussion Topics / Questions:
${reportedQuestions.length > 0 ? reportedQuestions.join('; ') : 'No specific reported questions.'}

Generate JSON matching schema:
{
  "questions": [
    {
      "requirement_ids": ["${validReqIds[0] || 'r1'}"],
      "category": "technical",
      "prompt": "How do you handle database connection pool exhaustion in a high-concurrency Node.js microservice during traffic spikes?",
      "answer_outline": "• Connection pool sizing & timeout configuration\\n• Implementing Redis caching & query batching\\n• Applying backpressure & circuit breakers",
      "difficulty": 2
    }
  ],
  "flashcards": [
    {
      "requirement_ids": ["${validReqIds[0] || 'r1'}"],
      "front": "What is the key difference between pessimistic and optimistic locking in distributed databases?",
      "back": "Pessimistic locking locks records at read time preventing concurrent edits, while optimistic locking uses version timestamps to check for conflicts at commit time."
    }
  ]
}`;

    try {
      const result = await provider.generateJSON(prompt, CombinedGenerationSchema, systemPrompt);

      // Normalize & map questions
      const validQuestions: Question[] = (result.questions || [])
        .filter(q => this.validateQuestionQuality(q.prompt))
        .map((q, i) => {
          // Normalize requirement IDs to ensure they reference existing valid requirement IDs
          let reqIds = (q.requirement_ids || []).filter((id: string) => validReqIds.includes(id));
          if (reqIds.length === 0) {
            reqIds = [validReqIds[i % validReqIds.length]];
          }

          return {
            id: `q${i + 1}`,
            requirement_ids: reqIds,
            category: q.category || 'technical',
            prompt: q.prompt,
            answer_outline: q.answer_outline || '• Key technical concepts\n• Architectural tradeoffs\n• Production best practices',
            difficulty: (Math.min(Math.max(q.difficulty || 2, 1), 3)) as 1 | 2 | 3,
            _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
          };
        });

      // Normalize & map flashcards
      const validFlashcards: Flashcard[] = (result.flashcards || [])
        .filter(f => f.front && f.back && f.front.length > 10)
        .map((f, i) => {
          let reqIds = (f.requirement_ids || []).filter((id: string) => validReqIds.includes(id));
          if (reqIds.length === 0) {
            reqIds = [validReqIds[i % validReqIds.length]];
          }

          return {
            id: `f${i + 1}`,
            requirement_ids: reqIds,
            front: f.front,
            back: f.back,
            confidence: 0,
            _meta: { generated: true, edited: false, pinned: false }
          };
        });

      if (validQuestions.length === 0) {
        return this.generateSmartFallback(roleTitle, requirements);
      }

      return { questions: validQuestions, flashcards: validFlashcards };
    } catch (error: any) {
      console.warn('[QuestionGenerator Warning] LLM generation failed. Using smart fallback generator.', error.message);
      return this.generateSmartFallback(roleTitle, requirements);
    }
  }

  /**
   * Generates targeted questions for uncovered requirement IDs
   */
  static async generateMissingQuestions(
    uncoveredReqs: Requirement[],
    existingQuestionsCount: number
  ): Promise<Question[]> {
    if (uncoveredReqs.length === 0) return [];

    const provider = getLLMProvider();
    const validReqIds = uncoveredReqs.map(r => r.id);

    const systemPrompt = `You are a Technical Interview Lead fixing coverage gaps for requirements: ${validReqIds.join(', ')}.`;

    const prompt = `Uncovered Requirements:\n${JSON.stringify(uncoveredReqs, null, 2)}\n\nGenerate realistic, scenario-based interview questions for these requirement IDs starting at q${existingQuestionsCount + 1}.`;

    try {
      const missingQuestions = await provider.generateJSON<any[]>(prompt, z.array(FlexibleQuestionSchema), systemPrompt);
      return (missingQuestions || [])
        .filter(q => this.validateQuestionQuality(q.prompt))
        .map((q, i) => {
          let reqIds = (q.requirement_ids || []).filter((id: string) => validReqIds.includes(id));
          if (reqIds.length === 0) {
            reqIds = [uncoveredReqs[i % uncoveredReqs.length].id];
          }

          return {
            id: `q${existingQuestionsCount + i + 1}`,
            requirement_ids: reqIds,
            category: q.category || (uncoveredReqs[i % uncoveredReqs.length]?.kind === 'behavioural' ? 'behavioural' : 'technical'),
            prompt: q.prompt,
            answer_outline: q.answer_outline || '• Technical approach\n• System tradeoffs\n• Testing & monitoring',
            difficulty: (Math.min(Math.max(q.difficulty || 2, 1), 3)) as 1 | 2 | 3,
            _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
          };
        });
    } catch (error: any) {
      console.warn('[QuestionGenerator Warning] LLM missing questions generation failed. Using smart fallback.', error.message);
      return uncoveredReqs.map((req, i) => this.buildSmartQuestion(req, `q${existingQuestionsCount + i + 1}`));
    }
  }

  /**
   * Smart Context-Aware Fallback Generator (No generic template strings!)
   */
  private static generateSmartFallback(
    roleTitle: string,
    requirements: Requirement[]
  ): { questions: Question[]; flashcards: Flashcard[] } {
    const questions: Question[] = [];
    const flashcards: Flashcard[] = [];

    const skillReqs = requirements.filter(r => !/location|city|hyderabad|stipend|perks|benefits|bonus/i.test(r.text));
    const targetList = skillReqs.length > 0 ? skillReqs : requirements;

    targetList.forEach((req, idx) => {
      const qId = `q${idx + 1}`;
      const fId = `f${idx + 1}`;

      questions.push(this.buildSmartQuestion(req, qId));

      flashcards.push({
        id: fId,
        requirement_ids: [req.id],
        front: this.buildSmartFlashcardFront(req.text),
        back: this.buildSmartFlashcardBack(req.text),
        confidence: 0,
        _meta: { generated: true, edited: false, pinned: false }
      });
    });

    return { questions, flashcards };
  }

  private static buildSmartQuestion(req: Requirement, qId: string): Question {
    const text = req.text;
    const lower = text.toLowerCase();

    let cat: Question['category'] = 'technical';
    let prompt = '';
    let answerOutline = '';

    if (req.kind === 'behavioural' || lower.includes('lead') || lower.includes('collaboration') || lower.includes('communication')) {
      cat = 'behavioural';
      prompt = `Tell me about a time you led an engineering effort involving "${text}". How did you balance technical tradeoffs with project deadlines?`;
      answerOutline = `• Situation & Task context\n• Actions taken & technical decisions\n• Measurable outcomes & lessons learned`;
    } else if (lower.includes('architecture') || lower.includes('system') || lower.includes('scale') || lower.includes('distributed')) {
      cat = 'system-design';
      prompt = `How would you architect a fault-tolerant distributed system that addresses "${text}" under high concurrency and traffic spikes?`;
      answerOutline = `• High-level component architecture & API gateway\n• Data partition, replication, and caching strategy\n• Failover, rate limiting, and observability`;
    } else {
      cat = 'technical';
      prompt = `What engineering patterns and best practices do you follow when implementing "${text}" in production applications?`;
      answerOutline = `• Core implementation patterns & error handling\n• Performance optimization & resource management\n• Automated testing & deployment safeguards`;
    }

    return {
      id: qId,
      requirement_ids: [req.id],
      category: cat,
      prompt,
      answer_outline: answerOutline,
      difficulty: req.priority === 'must' ? 2 : 1,
      _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
    };
  }

  private static buildSmartFlashcardFront(text: string): string {
    return `What are the core technical principles and architectural considerations behind ${text}?`;
  }

  private static buildSmartFlashcardBack(text: string): string {
    return `Key technical aspects of ${text}:\n1. Modular separation of concerns and clear interfaces\n2. Robust error handling, retries, and logging\n3. Efficient memory/CPU usage and caching strategies`;
  }
}
