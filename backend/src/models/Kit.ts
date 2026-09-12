import mongoose, { Schema, Document } from 'mongoose';
import { KitData } from '../services/validation/kitSchema.js';

export type KitGenerationStatus =
  | 'queued'
  | 'analyzing_jd'
  | 'extracting'
  | 'crawling_company'
  | 'discovering_company_pages'
  | 'searching_interviews'
  | 'fetching_sources'
  | 'extracting_evidence'
  | 'hiring_research'
  | 'generating_questions'
  | 'checking_coverage'
  | 'closing_gaps'
  | 'creating_flashcards'
  | 'building_schedule'
  | 'validating'
  | 'completed'
  | 'failed';

// Sub-Schema Definitions for Modular & Strongly-Typed Kit Data Validation
const RequirementSubSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    kind: { type: String, enum: ['technical', 'behavioural', 'domain'], required: true },
    priority: { type: String, enum: ['must', 'nice'], required: true }
  },
  { _id: false }
);

const QuestionSubSchema = new Schema(
  {
    id: { type: String, required: true },
    requirement_ids: [{ type: String }],
    category: {
      type: String,
      enum: ['technical', 'behavioural', 'system-design', 'company-fit'],
      required: true
    },
    prompt: { type: String, required: true },
    answer_outline: { type: String, required: true },
    difficulty: { type: Number, required: true, min: 1, max: 3 },
    _meta: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const FlashcardSubSchema = new Schema(
  {
    id: { type: String, required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    requirement_ids: [{ type: String }],
    confidence: { type: Number },
    lastPracticedAt: { type: String },
    _meta: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const ScheduleDaySubSchema = new Schema(
  {
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    question_ids: [{ type: String }],
    minutes: { type: Number, required: true },
    isCompleted: { type: Boolean, default: false }
  },
  { _id: false }
);

const ScheduleSubSchema = new Schema(
  {
    days_available: { type: Number, required: true },
    days: [ScheduleDaySubSchema]
  },
  { _id: false }
);

const CoverageSubSchema = new Schema(
  {
    uncovered_requirement_ids: [{ type: String }],
    passes: { type: Number, default: 1 }
  },
  { _id: false }
);

const CompanyBriefSubSchema = new Schema(
  {
    summary: { type: String },
    what_they_do: { type: String },
    interview_process: [{ type: String }],
    take_home_assignment: { type: String },
    interview_patterns: { type: Schema.Types.Mixed },
    process_found: { type: Boolean, default: true },
    sources: [{ type: String }]
  },
  { _id: false }
);

const SourceSubSchema = new Schema(
  {
    company: { type: String },
    company_url: { type: String },
    role: { type: String },
    location: { type: String },
    jd_chars: { type: Number },
    researched_at: { type: String },
    pages_used: [{ type: String }]
  },
  { _id: false }
);

const RoleSubSchema = new Schema(
  {
    title: { type: String },
    seniority: { type: String },
    responsibilities: [{ type: String }],
    requirements: [RequirementSubSchema]
  },
  { _id: false }
);

const KitDataSubSchema = new Schema(
  {
    source: SourceSubSchema,
    company_brief: CompanyBriefSubSchema,
    role: RoleSubSchema,
    questions: [QuestionSubSchema],
    flashcards: [FlashcardSubSchema],
    schedule: ScheduleSubSchema,
    coverage: CoverageSubSchema
  },
  { _id: false }
);

export interface KitLogItem {
  text: string;
  time: string;
  url?: string;
}

export interface CrawledSourceItem {
  name: string;
  url: string;
  status: string;
}

export interface IKitDocument extends Document {
  userId: mongoose.Types.ObjectId;
  jobDescription: string;
  companyUrl: string;
  daysAvailable: number;
  status: KitGenerationStatus;
  stepMessage: string;
  progressPercent: number;
  logs?: KitLogItem[];
  crawledSources?: CrawledSourceItem[];
  data?: KitData;
  error?: {
    code: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const KitSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    jobDescription: {
      type: String,
      required: true
    },
    companyUrl: {
      type: String,
      required: true
    },
    daysAvailable: {
      type: Number,
      required: true,
      min: 1,
      max: 60
    },
    status: {
      type: String,
      required: true,
      default: 'queued'
    },
    stepMessage: {
      type: String,
      default: 'Initializing generation pipeline...'
    },
    progressPercent: {
      type: Number,
      default: 0
    },
    logs: [
      {
        text: { type: String },
        time: { type: String },
        url: { type: String }
      }
    ],
    crawledSources: [
      {
        name: { type: String },
        url: { type: String },
        status: { type: String }
      }
    ],
    data: {
      type: KitDataSubSchema
    },
    error: {
      code: String,
      message: String
    }
  },
  { timestamps: true }
);

export const KitModel = mongoose.model<IKitDocument>('Kit', KitSchema);
