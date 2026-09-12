import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionDocument extends Document {
  kitId: mongoose.Types.ObjectId;
  company?: string;
  role?: string;
  questionId: string;
  requirement_ids: string[];
  category: 'technical' | 'behavioural' | 'system-design' | 'company-fit';
  prompt: string;
  answer_outline: string;
  difficulty: number;
  _meta?: any;
}

const QuestionSchema = new Schema(
  {
    kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true },
    company: { type: String, index: true },
    role: { type: String, index: true },
    questionId: { type: String, required: true },
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
  { timestamps: true }
);

export const QuestionModel = mongoose.model<IQuestionDocument>('Question', QuestionSchema);
