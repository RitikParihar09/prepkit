import { Requirement, Question, Schedule, ScheduleDay } from '../validation/kitSchema.js';

export class ScheduleAllocator {
  /**
   * Deterministically allocates questions into exactly N study days.
   */
  static allocateSchedule(
    daysAvailable: number,
    requirements: Requirement[],
    questions: Question[]
  ): Schedule {
    // Sanitize input days available to 1-60 range
    const numDays = Math.max(1, Math.min(60, Math.floor(daysAvailable)));

    const validQuestions = questions.filter(q => q && typeof q.id === 'string' && q.id.length > 0);
    const reqPriorityMap = new Map<string, 'must' | 'nice'>(requirements.map(r => [r.id, r.priority]));

    // Sort questions by:
    // 1. Must-have requirement coverage (Must > Nice)
    // 2. Difficulty (Harder 3 > 2 > 1)
    const sortedQuestions = [...validQuestions].sort((a, b) => {
      const aIsMust = a.requirement_ids.some(id => reqPriorityMap.get(id) === 'must');
      const bIsMust = b.requirement_ids.some(id => reqPriorityMap.get(id) === 'must');

      if (aIsMust !== bIsMust) {
        return aIsMust ? -1 : 1;
      }
      return b.difficulty - a.difficulty; // Higher difficulty first
    });

    // Initialize array of N days
    const days: ScheduleDay[] = Array.from({ length: numDays }, (_, i) => ({
      day: i + 1,
      focus: `Day ${i + 1} Preparation`,
      question_ids: [],
      minutes: 0
    }));

    if (sortedQuestions.length > 0) {
      if (sortedQuestions.length >= numDays) {
        // More or equal questions than days: Distribute questions chronologically based on sorted weight
        // Earliest days get highest priority & hardest questions first
        sortedQuestions.forEach((q, index) => {
          // Calculate day index: spread smoothly across N days
          const dayIdx = Math.min(Math.floor((index / sortedQuestions.length) * numDays), numDays - 1);
          days[dayIdx].question_ids.push(q.id);
        });
      } else {
        // Fewer questions than days (sparse set, e.g. 60 days with 10 questions):
        // Put questions on the first N days, later days focus on review
        sortedQuestions.forEach((q, index) => {
          days[index].question_ids.push(q.id);
        });
      }
    }

    // Set focus title, integer minutes, and ensure valid question references
    const validQuestionIdSet = new Set(validQuestions.map(q => q.id));

    days.forEach(d => {
      // Filter out any invalid question IDs
      d.question_ids = d.question_ids.filter(id => validQuestionIdSet.has(id));

      const dayQuestions = validQuestions.filter(q => d.question_ids.includes(q.id));
      
      if (dayQuestions.length > 0) {
        // Calculate integer minutes based on difficulty points (e.g. 20 min per difficulty level)
        const totalDifficulty = dayQuestions.reduce((acc, q) => acc + (q.difficulty || 2), 0);
        d.minutes = Math.round(totalDifficulty * 20);

        // Derive meaningful focus string from predominant category or requirement text
        const categories = dayQuestions.map(q => q.category);
        const mostFreqCat = this.getMostFrequentCategory(categories);
        const formattedCat = mostFreqCat ? mostFreqCat.replace('-', ' ').toUpperCase() : 'CORE CONCEPTS';
        d.focus = `${formattedCat} & Hands-on Practice`;
      } else {
        // Day with no new questions (e.g., in sparse schedules like 60 days):
        // Assign mock/review focus with baseline integer minutes
        if (sortedQuestions.length > 0) {
          // Reference a sample core question for review if available
          const reviewQ = sortedQuestions[(d.day - 1) % sortedQuestions.length];
          if (reviewQ) {
            d.question_ids.push(reviewQ.id);
            d.focus = `Deep Dive & Mock Practice (${reviewQ.category.replace('-', ' ').toUpperCase()})`;
            d.minutes = 45;
          } else {
            d.focus = 'Comprehensive Review & Mock Interview Prep';
            d.minutes = 30;
          }
        } else {
          d.focus = 'General Interview Readiness Review';
          d.minutes = 30;
        }
      }

      // Ensure minutes is always a positive integer
      d.minutes = Math.max(15, Math.round(d.minutes));
    });

    return {
      days_available: numDays,
      days
    };
  }

  private static getMostFrequentCategory(categories: string[]): string | null {
    if (categories.length === 0) return null;
    const counts = new Map<string, number>();
    categories.forEach(c => counts.set(c, (counts.get(c) || 0) + 1));

    let bestCat = categories[0];
    let maxCount = 0;
    counts.forEach((count, cat) => {
      if (count > maxCount) {
        maxCount = count;
        bestCat = cat;
      }
    });
    return bestCat;
  }
}
