import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyBriefDocument extends Document {
  kitId: mongoose.Types.ObjectId;
  summary: string;
  what_they_do: string;
  interview_process?: string[];
  take_home_assignment?: string;
  interview_patterns?: any[];
  process_found?: boolean;
  sources: string[];
}

const CompanyBriefSchema = new Schema(
  {
    kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true, unique: true },
    summary: { type: String },
    what_they_do: { type: String },
    interview_process: [{ type: String }],
    take_home_assignment: { type: String },
    interview_patterns: { type: Schema.Types.Mixed },
    process_found: { type: Boolean, default: true },
    sources: [{ type: String }]
  },
  { timestamps: true }
);

export const CompanyBriefModel = mongoose.model<ICompanyBriefDocument>('CompanyBrief', CompanyBriefSchema);
