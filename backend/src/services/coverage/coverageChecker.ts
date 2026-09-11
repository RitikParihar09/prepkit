import { Requirement, Question, Coverage } from '../validation/kitSchema.js';

export class CoverageChecker {
  /**
   * Deterministic application logic to verify requirement coverage
   */
  static checkCoverage(
    requirements: Requirement[],
    questions: Question[],
    currentPass: number
  ): Coverage {
    const mustRequirements = requirements.filter(r => r.priority === 'must');
    
    // Collect all requirement IDs referenced by existing questions
    const coveredReqIds = new Set<string>();
    for (const q of questions) {
      if (Array.isArray(q.requirement_ids)) {
        for (const reqId of q.requirement_ids) {
          coveredReqIds.add(reqId);
        }
      }
    }

    // Find uncovered must-have requirement IDs
    const uncovered_requirement_ids = mustRequirements
      .filter(r => !coveredReqIds.has(r.id))
      .map(r => r.id);

    return {
      uncovered_requirement_ids,
      passes: currentPass
    };
  }
}
