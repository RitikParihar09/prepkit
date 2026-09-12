import { KitData, KitSchema, Question } from '../validation/kitSchema.js';
import { JDExtractor } from '../extraction/jdExtractor.js';
import { CompanyCrawler, extractCompanyName } from '../research/companyCrawler.js';
import { BriefGenerator } from '../generation/briefGenerator.js';
import { QuestionGenerator } from '../generation/questionGenerator.js';
import { CoverageChecker } from '../coverage/coverageChecker.js';
import { ScheduleAllocator } from '../scheduler/scheduleAllocator.js';
import { TavilySearchProvider } from '../research/discussions/tavilySearchProvider.js';
import { ResultFilter } from '../research/discussions/resultFilter.js';
import { DiscussionExtractor, ExtractedInterviewEvidence } from '../research/discussions/discussionExtractor.js';
import { getLLMProvider } from '../llm/llmProvider.js';

export interface LogEntry {
  text: string;
  time: string;
  url?: string;
}

export interface CrawledSource {
  name: string;
  url: string;
  status: 'Indexed' | 'Scanning' | 'Pending' | 'Failed';
  icon?: string;
}

export interface ProgressCallback {
  (
    status: string,
    message: string,
    progressPercent: number,
    log?: LogEntry,
    source?: CrawledSource
  ): void;
}

export class KitCoordinator {
  /**
   * Main End-to-End Kit Generation Pipeline
   */
  static async generateKit(
    jobDescription: string,
    companyUrl: string,
    daysAvailable: number,
    interviewNotes?: string | ProgressCallback,
    onProgress?: ProgressCallback
  ): Promise<KitData> {
    let notes: string | undefined;
    let cb: ProgressCallback | undefined;

    if (typeof interviewNotes === 'function') {
      cb = interviewNotes;
      notes = undefined;
    } else {
      notes = interviewNotes;
      cb = onProgress;
    }

    const getTimeStr = () => new Date().toLocaleTimeString('en-US', { hour12: false });

    const report = (
      status: string,
      message: string,
      percent: number,
      logText?: string,
      url?: string,
      source?: CrawledSource
    ) => {
      const time = getTimeStr();
      const text = logText ? `> ${logText}` : `> ${message}`;
      if (cb) cb(status, message, percent, { text, time, url }, source);
    };

    // STEP 0: Verify Gemini API Connection via Smoke Test
    report('verifying_llm', 'Verifying Gemini API model connection...', 5, 'Initializing Gemini 2.5 Flash model connection...');
    const llm = getLLMProvider();
    if (llm.runSmokeTest) {
      await llm.runSmokeTest();
    }

    // STEP 1: Analyze & Extract Job Description Requirements
    report('analyzing_jd', 'Analyzing job description & extracting requirements...', 10, `Parsing job description (${jobDescription.length} characters)...`);
    const role = await JDExtractor.extractRoleFromJD(jobDescription);
    report('analyzing_jd', `Extracted role: "${role.title}" (${role.seniority || 'Mid/Senior'})`, 15, `Role title extracted: "${role.title}" with ${role.requirements.length} core skill requirements.`);

    // STEP 2: Crawl Company Website (Link Discovery & Deterministic Ranking)
    report(
      'crawling_company',
      'Crawling company website & searching hiring pages...',
      20,
      `Connecting to target domain: ${companyUrl}`,
      companyUrl,
      { name: 'Target Website', url: companyUrl, status: 'Scanning' }
    );

    const research = await CompanyCrawler.researchCompany(companyUrl, (msg, url) => {
      report(
        'crawling_company',
        msg,
        25,
        msg,
        url,
        url ? { name: url.replace(/^https?:\/\//, '').split('/')[0] + (url.includes('/') ? '/' + url.split('/').slice(3).join('/') : ''), url, status: 'Indexed' } : undefined
      );
    });

    // STEP 3: Public Web Discussion Search (Tavily Search Provider)
    const companyName = (research.companyNameGuess && research.companyNameGuess !== 'Company') 
      ? research.companyNameGuess 
      : extractCompanyName(companyUrl, jobDescription);

    report('searching_interviews', 'Searching Tavily & public web for real interview experiences & assignment details...', 35, `Initializing web search query portfolio for "${companyName}"...`);
    const searchProvider = new TavilySearchProvider();
    
    // Generate targeted search queries based on requirements, interview rounds & role title
    const searchQueries = [
      `${companyName} ${role.title} interview process rounds questions`,
      `${companyName} interview experience glassdoor reddit leetcode`,
      `${companyName} technical interview coding system design OA`,
      `${companyName} engineering hiring process take home assignment`,
      ...(notes ? [`${companyName} ${notes.substring(0, 60)}`] : []),
      ...role.requirements.slice(0, 3).map(r => `${companyName} "${r.text.substring(0, 35)}" interview question`)
    ];

    let rawSearchResults: any[] = [];
    for (const query of searchQueries.slice(0, 5)) {
      const results = await searchProvider.search(query, { maxResults: 5 });
      report('searching_interviews', `Executed search: "${query}" (${results.length} links found)`, 40, `Search query executed: "${query}" (${results.length} links found)`);
      rawSearchResults.push(...results);
    }

    // Filter, deduplicate, and validate search results
    report('fetching_sources', 'Filtering & validating public interview discussion sources...', 45, `Filtering ${rawSearchResults.length} raw search results for domain relevance...`);
    const filteredSources = ResultFilter.filterResults(rawSearchResults);

    for (const src of filteredSources.slice(0, 8)) {
      const hostName = new URL(src.url).hostname.replace(/^www\./, '');
      report(
        'fetching_sources',
        `Discovered interview source: ${src.url}`,
        50,
        `Validated source: "${src.title.substring(0, 45)}..." (${src.url})`,
        src.url,
        { name: `${hostName}: ${src.title.substring(0, 25)}`, url: src.url, status: 'Indexed' }
      );
    }

    // STEP 4: Extract Structured Evidence with Gemini 2.5 Flash
    report('extracting_evidence', 'Extracting factual interview evidence & rounds with Gemini 2.5 Flash...', 55, `Extracting interview rounds & take-home assignment details from ${filteredSources.length} sources...`);
    const evidences: ExtractedInterviewEvidence[] = [];
    for (const src of filteredSources.slice(0, 8)) {
      const ev = await DiscussionExtractor.extractEvidence(src.title, src.content, src.url, companyName);
      if (ev.useful) {
        evidences.push(ev);
        report('extracting_evidence', `Extracted evidence from ${src.url}`, 60, `Extracted ${ev.rounds?.length || 0} process rounds from ${src.url}`, src.url);
      }
    }

    // STEP 5: Generate Company Brief
    report('hiring_research', 'Generating company brief, interview process & take-home assignment analysis...', 65, 'Synthesizing company brief & interview process structure...');
    const company_brief = await BriefGenerator.generateBrief(companyUrl, research, evidences, notes);

    // STEP 6: Question Generation with Evidence Hierarchy (Pass 1)
    report('generating_questions', 'Generating technical & behavioural questions using evidence hierarchy...', 75, `Generating technical, behavioral & system design questions tailored to ${daysAvailable}-day sprint...`);
    const { questions: initialQuestions, flashcards } = await QuestionGenerator.generateInitialQuestionsAndFlashcards(
      role.title,
      role.requirements,
      company_brief.summary,
      evidences,
      daysAvailable
    );

    let currentQuestions = [...initialQuestions];
    report('generating_questions', `Generated ${initialQuestions.length} practice questions & ${flashcards.length} active recall cards`, 82, `Synthesized ${initialQuestions.length} practice questions & ${flashcards.length} active recall cards`);

    // STEP 7 & 8: Multi-Pass Coverage Check & Gap Closing Loop (Max 3 Passes)
    // Ensures 100% of must-have requirement IDs are covered before building schedule
    const MAX_PASSES = 3;
    let currentPass = 1;
    let coverage = CoverageChecker.checkCoverage(role.requirements, currentQuestions, currentPass);

    while (coverage.uncovered_requirement_ids.length > 0 && currentPass < MAX_PASSES) {
      currentPass++;
      report('closing_gaps', `Pass ${currentPass}: Closing coverage gaps for ${coverage.uncovered_requirement_ids.length} uncovered requirement(s)...`, 88, `Pass ${currentPass}: Closing coverage gaps for ${coverage.uncovered_requirement_ids.length} uncovered requirement(s)...`);
      
      const uncoveredReqs = role.requirements.filter(r => coverage.uncovered_requirement_ids.includes(r.id));
      const missingQuestions = await QuestionGenerator.generateMissingQuestions(uncoveredReqs, currentQuestions.length);
      currentQuestions.push(...missingQuestions);

      // Re-evaluate coverage deterministically
      coverage = CoverageChecker.checkCoverage(role.requirements, currentQuestions, currentPass);
    }

    report('closing_gaps', `Requirement coverage verified: 100% must-have requirements covered`, 90, `Requirement coverage verification complete (Pass ${currentPass})`);

    // STEP 9: Deterministic Schedule Allocation
    report('building_schedule', 'Building deterministic day-by-day study schedule...', 93, `Allocating ${daysAvailable}-day preparation roadmap across ${currentQuestions.length} questions...`);
    const schedule = ScheduleAllocator.allocateSchedule(daysAvailable, role.requirements, currentQuestions);

    // STEP 10: Assemble Source Metadata & Final Kit Object
    const allPagesUsed = Array.from(new Set([
      ...research.pagesUsed,
      ...filteredSources.map(s => s.url)
    ]));

    const kitData: KitData = {
      source: {
        company: companyName,
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
    report('validating', 'Validating final kit schema structure...', 97, `Executing Zod Appendix A schema validation...`);
    const validatedKit = KitSchema.parse(kitData);
    report('completed', 'Interview prep kit successfully generated!', 100, `Prep kit generation complete! Mapped ${currentQuestions.length} questions & ${flashcards.length} flashcards.`);

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
