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

export interface IKitDocument extends Document {
  userId: mongoose.Types.ObjectId;
  jobDescription: string;
  companyUrl: string;
  daysAvailable: number;
  status: KitGenerationStatus;
  stepMessage: string;
  progressPercent: number;
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
    data: {
      type: Schema.Types.Mixed
    },
    error: {
      code: String,
      message: String
    }
  },
  { timestamps: true }
);

export const KitModel = mongoose.model<IKitDocument>('Kit', KitSchema);
