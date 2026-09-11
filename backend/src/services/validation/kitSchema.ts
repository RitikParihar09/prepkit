import { z } from 'zod';

export const RequirementSchema = z.object({
  id: z.string().regex(/^r\d+$/, 'Requirement ID must be stable format like r1, r2'),
  text: z.string().min(1, 'Requirement text cannot be empty'),
  kind: z.enum(['technical', 'behavioural', 'domain']),
  priority: z.enum(['must', 'nice'])
});

export const QuestionCategorySchema = z.enum([
  'technical',
  'behavioural',
  'system-design',
  'company-fit'
]);

export const ItemMetaSchema = z.object({
  generated: z.boolean(),
  edited: z.boolean(),
  pinned: z.boolean(),
  updatedAt: z.string().optional()
}).optional();

export const QuestionSchema = z.object({
  id: z.string().regex(/^q\d+$/, 'Question ID must be stable format like q1, q2'),
  requirement_ids: z.array(z.string()).min(1, 'Question must reference at least one requirement_id'),
  category: QuestionCategorySchema,
  prompt: z.string().min(1, 'Question prompt cannot be empty'),
  answer_outline: z.union([z.string(), z.array(z.string())]).transform(
    val => (Array.isArray(val) ? val.join('\n') : val)
  ),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  _meta: ItemMetaSchema
});

export const FlashcardSchema = z.object({
  id: z.string().regex(/^f\d+$/, 'Flashcard ID must be stable format like f1, f2'),
  front: z.string().min(1, 'Front text cannot be empty'),
  back: z.string().min(1, 'Back text cannot be empty'),
  requirement_ids: z.array(z.string()).min(1, 'Flashcard must reference at least one requirement_id'),
  confidence: z.number().min(1).max(5).optional(),
  lastPracticedAt: z.string().optional(),
  _meta: ItemMetaSchema
});

export const ScheduleDaySchema = z.object({
  day: z.number().int().min(1),
  focus: z.string().min(1, 'Day focus title is required'),
  question_ids: z.array(z.string()),
  minutes: z.number().int().min(1, 'Minutes must be a positive integer'),
  isCompleted: z.boolean().optional()
});

export const ScheduleSchema = z.object({
  days_available: z.number().int().min(1).max(60),
  days: z.array(ScheduleDaySchema).min(1)
});

export const CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().min(1)
});

export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string())
});

export const SourceSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int(),
  researched_at: z.string(),
  pages_used: z.array(z.string())
});

export const RoleSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema)
});

export const KitSchema = z.object({
  source: SourceSchema,
  company_brief: CompanyBriefSchema,
  role: RoleSchema,
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: ScheduleSchema,
  coverage: CoverageSchema
});

export type Requirement = z.infer<typeof RequirementSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;
export type ScheduleDay = z.infer<typeof ScheduleDaySchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type Coverage = z.infer<typeof CoverageSchema>;
export type CompanyBrief = z.infer<typeof CompanyBriefSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type KitData = z.infer<typeof KitSchema>;

/**
 * Strips internal metadata (_meta) if strict exact Appendix A JSON is required.
 */
export function stripInternalMetadata(kit: KitData): KitData {
  const clean = JSON.parse(JSON.stringify(kit));
  if (Array.isArray(clean.questions)) {
    clean.questions.forEach((q: any) => delete q._meta);
  }
  if (Array.isArray(clean.flashcards)) {
    clean.flashcards.forEach((f: any) => delete f._meta);
  }
  return clean;
}
