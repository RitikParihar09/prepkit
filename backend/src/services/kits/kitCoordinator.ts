import { KitData, KitSchema, Question } from '../validation/kitSchema.js';
import { JDExtractor } from '../extraction/jdExtractor.js';
import { CompanyCrawler } from '../research/companyCrawler.js';
import { BriefGenerator } from '../generation/briefGenerator.js';
import { QuestionGenerator } from '../generation/questionGenerator.js';
import { CoverageChecker } from '../coverage/coverageChecker.js';
import { ScheduleAllocator } from '../scheduler/scheduleAllocator.js';
import { TavilySearchProvider } from '../research/discussions/tavilySearchProvider.js';
import { ResultFilter } from '../research/discussions/resultFilter.js';
import { DiscussionExtractor, ExtractedInterviewEvidence } from '../research/discussions/discussionExtractor.js';
import { getLLMProvider } from '../llm/llmProvider.js';

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

    // STEP 0: Verify Gemini API Connection via Smoke Test
    report('verifying_llm', 'Verifying Gemini API model connection...', 5);
    const llm = getLLMProvider();
    if (llm.runSmokeTest) {
      await llm.runSmokeTest();
    }

    // STEP 1: Analyze & Extract Job Description Requirements
    report('analyzing_jd', 'Analyzing job description & extracting requirements...', 10);
    const role = await JDExtractor.extractRoleFromJD(jobDescription);

    // STEP 2: Crawl Company Website (Link Discovery & Deterministic Ranking)
    report('crawling_company', 'Crawling company website & searching hiring pages...', 20);
    const research = await CompanyCrawler.researchCompany(companyUrl);

    // STEP 3: Public Web Discussion Search (Tavily Search Provider)
    report('searching_interviews', 'Searching Tavily & public web for real interview experiences...', 35);
    const searchProvider = new TavilySearchProvider();
    const companyName = research.companyNameGuess || 'Company';
    
    // Generate targeted search queries based on requirements & role title
    const searchQueries = [
      `"${companyName}" "${role.title}" interview experience questions`,
      `"${companyName}" technical interview coding system design`,
      ...role.requirements.slice(0, 3).map(r => `"${companyName}" "${r.text}" interview questions`)
    ];

    let rawSearchResults: any[] = [];
    for (const query of searchQueries.slice(0, 3)) {
      const results = await searchProvider.search(query, { maxResults: 3 });
      rawSearchResults.push(...results);
    }

    // Filter, deduplicate, and validate search results
    report('fetching_sources', 'Filtering & validating public interview discussion sources...', 45);
    const filteredSources = ResultFilter.filterResults(rawSearchResults);

    // STEP 4: Extract Structured Evidence with Gemini 2.5 Flash
    report('extracting_evidence', 'Extracting factual interview evidence with Gemini 2.5 Flash...', 55);
    const evidences: ExtractedInterviewEvidence[] = [];
    for (const src of filteredSources.slice(0, 4)) {
      const ev = await DiscussionExtractor.extractEvidence(src.title, src.content, src.url, companyName);
      if (ev.useful) {
        evidences.push(ev);
      }
    }

    // STEP 5: Generate Company Brief
    report('hiring_research', 'Generating company brief from research text...', 65);
    const company_brief = await BriefGenerator.generateBrief(companyUrl, research);

    // STEP 6: Question Generation with Evidence Hierarchy (Pass 1)
    report('generating_questions', 'Generating technical & behavioural questions using evidence hierarchy...', 75);
    const { questions: initialQuestions, flashcards } = await QuestionGenerator.generateInitialQuestionsAndFlashcards(
      role.title,
      role.requirements,
      company_brief.summary,
      evidences
    );

    let currentQuestions = [...initialQuestions];

    // STEP 7: Deterministic Coverage Check (Pass 1)
    report('checking_coverage', 'Running deterministic coverage check against requirements...', 82);
    let coverage = CoverageChecker.checkCoverage(role.requirements, currentQuestions, 1);

    // STEP 8: Second-Pass Gap Closing if Must-Have Requirements are Uncovered
    if (coverage.uncovered_requirement_ids.length > 0) {
      report('closing_gaps', `Closing coverage gaps for ${coverage.uncovered_requirement_ids.length} uncovered requirement(s)...`, 88);
      const uncoveredReqs = role.requirements.filter(r => coverage.uncovered_requirement_ids.includes(r.id));
      const missingQuestions = await QuestionGenerator.generateMissingQuestions(uncoveredReqs, currentQuestions.length);
      currentQuestions.push(...missingQuestions);

      // Re-run deterministic coverage check for Pass 2
      coverage = CoverageChecker.checkCoverage(role.requirements, currentQuestions, 2);
    }

    // STEP 9: Deterministic Schedule Allocation
    report('building_schedule', 'Building deterministic day-by-day study schedule...', 92);
    const schedule = ScheduleAllocator.allocateSchedule(daysAvailable, role.requirements, currentQuestions);

    // STEP 10: Assemble Source Metadata & Final Kit Object
    const allPagesUsed = Array.from(new Set([
      ...research.pagesUsed,
      ...filteredSources.map(s => s.url)
    ]));

    const kitData: KitData = {
      source: {
        company: research.companyNameGuess || 'Company',
        company_url: companyUrl,
        role: role.title,
        location: 'Remote / On-site',
        jd_chars: jobDescription.length,
        researched_at: new Date().toISOString(),
        pages_used: allPagesUsed
      },
      company_brief,
      role,
      questions: currentQuestions,
      flashcards,
      schedule,
      coverage
    };

    // STEP 11: Strict Zod Validation against Appendix A
    report('validating', 'Validating final kit schema structure...', 96);
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
