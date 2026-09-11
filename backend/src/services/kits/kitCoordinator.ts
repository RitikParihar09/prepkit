import { KitData, KitSchema, Question } from '../validation/kitSchema.js';
import { JDExtractor } from '../extraction/jdExtractor.js';
import { CompanyCrawler } from '../research/companyCrawler.js';
import { BriefGenerator } from '../generation/briefGenerator.js';
import { QuestionGenerator } from '../generation/questionGenerator.js';
import { CoverageChecker } from '../coverage/coverageChecker.js';
import { ScheduleAllocator } from '../scheduler/scheduleAllocator.js';

export interface ProgressCallback {
  (status: string, message: string, progressPercent: number): void;
}

export class KitCoordinator {
  /**
   * Main End-to-End Kit Generation Pipeline
   */
  static async generateKit(
    jobDescription: string,
    companyUrl: string,
    daysAvailable: number,
    onProgress?: ProgressCallback
  ): Promise<KitData> {
    const report = (status: string, message: string, percent: number) => {
      if (onProgress) onProgress(status, message, percent);
    };

    // STEP 1: Analyze & Extract Job Description Requirements
    report('analyzing_jd', 'Analyzing job description & extracting requirements...', 10);
    const role = await JDExtractor.extractRoleFromJD(jobDescription);

    // STEP 2: Crawl Company Website & Research Hiring Info
    report('crawling_company', 'Crawling company website & searching hiring pages...', 25);
    const research = await CompanyCrawler.researchCompany(companyUrl);

    // STEP 3: Generate Company Brief
    report('hiring_research', 'Generating company brief from research text...', 40);
    const company_brief = await BriefGenerator.generateBrief(companyUrl, research);

    // STEP 4: Generate Categorized Questions & Flashcards (Pass 1)
    report('generating_questions', 'Generating technical & behavioural questions...', 55);
    const { questions: initialQuestions, flashcards } = await QuestionGenerator.generateInitialQuestionsAndFlashcards(
      role.title,
      role.requirements,
      company_brief.summary
    );

    let currentQuestions = [...initialQuestions];

    // STEP 5: Deterministic Coverage Check (Pass 1)
    report('checking_coverage', 'Running deterministic coverage check against requirements...', 70);
    let coverage = CoverageChecker.checkCoverage(role.requirements, currentQuestions, 1);

    // STEP 6: Second-Pass Gap Closing if Must-Have Requirements are Uncovered
    if (coverage.uncovered_requirement_ids.length > 0) {
      report('closing_gaps', `Closing coverage gaps for ${coverage.uncovered_requirement_ids.length} uncovered requirement(s)...`, 80);
      const uncoveredReqs = role.requirements.filter(r => coverage.uncovered_requirement_ids.includes(r.id));
      const missingQuestions = await QuestionGenerator.generateMissingQuestions(uncoveredReqs, currentQuestions.length);
      currentQuestions.push(...missingQuestions);

      // Re-run deterministic coverage check for Pass 2
      coverage = CoverageChecker.checkCoverage(role.requirements, currentQuestions, 2);
    }

    // STEP 7: Deterministic Schedule Allocation
    report('building_schedule', 'Building deterministic day-by-day study schedule...', 90);
    const schedule = ScheduleAllocator.allocateSchedule(daysAvailable, role.requirements, currentQuestions);

    // STEP 8: Assemble Source Metadata & Final Kit Object
    const kitData: KitData = {
      source: {
        company: research.companyNameGuess || 'Company',
        company_url: companyUrl,
        role: role.title,
        location: 'Remote / On-site',
        jd_chars: jobDescription.length,
        researched_at: new Date().toISOString(),
        pages_used: research.pagesUsed
      },
      company_brief,
      role,
      questions: currentQuestions,
      flashcards,
      schedule,
      coverage
    };

    // STEP 9: Strict Zod Validation against Appendix A
    report('validating', 'Validating final kit schema structure...', 95);
    const validatedKit = KitSchema.parse(kitData);
    report('completed', 'Interview prep kit successfully generated!', 100);

    return validatedKit;
  }

  /**
   * REGENERATION PRESERVING USER EDITS:
   * Regenerates questions in a given category while preserving edited or pinned questions.
   */
  static async regenerateCategory(
    existingKit: KitData,
    category: Question['category']
  ): Promise<KitData> {
    const updatedKit = JSON.parse(JSON.stringify(existingKit)) as KitData;

    // 1. Separate questions in target category into preserved vs unedited
    const categoryQuestions = updatedKit.questions.filter(q => q.category === category);
    const otherQuestions = updatedKit.questions.filter(q => q.category !== category);

    const preservedQuestions = categoryQuestions.filter(
      q => q._meta?.edited === true || q._meta?.pinned === true
    );

    // 2. Generate new replacement questions for category
    const { questions: freshQuestions } = await QuestionGenerator.generateInitialQuestionsAndFlashcards(
      updatedKit.role.title,
      updatedKit.role.requirements,
      updatedKit.company_brief.summary
    );

    const freshCategoryQuestions = freshQuestions
      .filter(q => q.category === category)
      .map((q, idx) => ({
        ...q,
        id: `q_new_${category}_${idx + 1}`,
        _meta: { generated: true, edited: false, pinned: false, updatedAt: new Date().toISOString() }
      }));

    // 3. Merge preserved questions with fresh questions
    const mergedCategoryQuestions = [...preservedQuestions, ...freshCategoryQuestions];

    // Re-index all questions sequentially (q1, q2, ...) while retaining requirement_ids and metadata
    const allQuestions = [...otherQuestions, ...mergedCategoryQuestions];
    allQuestions.forEach((q, idx) => {
      q.id = `q${idx + 1}`;
    });

    updatedKit.questions = allQuestions;

    // 4. Re-run deterministic coverage check & schedule allocation so schedule references valid IDs!
    updatedKit.coverage = CoverageChecker.checkCoverage(
      updatedKit.role.requirements,
      updatedKit.questions,
      updatedKit.coverage.passes || 1
    );

    updatedKit.schedule = ScheduleAllocator.allocateSchedule(
      updatedKit.schedule.days_available,
      updatedKit.role.requirements,
      updatedKit.questions
    );

    return KitSchema.parse(updatedKit);
  }
}
