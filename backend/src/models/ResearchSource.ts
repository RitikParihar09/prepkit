import mongoose, { Schema, Document } from 'mongoose';

export interface IResearchSourceDocument extends Document {
  kitId: mongoose.Types.ObjectId;
  url: string;
  domain: string;
  type: 'company_page' | 'interview_discussion';
  title: string;
  status: 'success' | 'unavailable' | 'rejected';
  retrievedAt: Date;
  evidence?: {
    topics: string[];
    reportedQuestions: string[];
    rounds: string[];
    confidence?: number;
  };
  error?: string;
  createdAt: Date;
}

const ResearchSourceSchema: Schema = new Schema(
  {
    kitId: {
      type: Schema.Types.ObjectId,
      ref: 'Kit',
      required: true,
      index: true
    },
    url: {
      type: String,
      required: true
    },
    domain: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['company_page', 'interview_discussion'],
      default: 'company_page'
    },
    title: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['success', 'unavailable', 'rejected'],
      default: 'success'
    },
    retrievedAt: {
      type: Date,
      default: Date.now
    },
    evidence: {
      topics: [String],
      reportedQuestions: [String],
      rounds: [String],
      confidence: Number
    },
    error: String
  },
  { timestamps: true }
);

export const ResearchSourceModel = mongoose.model<IResearchSourceDocument>('ResearchSource', ResearchSourceSchema);
