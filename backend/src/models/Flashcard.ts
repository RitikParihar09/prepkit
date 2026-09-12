import mongoose, { Schema, Document } from 'mongoose';

export interface IFlashcardDocument extends Document {
  kitId: mongoose.Types.ObjectId;
  company?: string;
  role?: string;
  flashcardId: string;
  front: string;
  back: string;
  requirement_ids: string[];
  confidence?: number;
  lastPracticedAt?: string;
  _meta?: any;
}

const FlashcardSchema = new Schema(
  {
    kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true },
    company: { type: String, index: true },
    role: { type: String, index: true },
    flashcardId: { type: String, required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    requirement_ids: [{ type: String }],
    confidence: { type: Number },
    lastPracticedAt: { type: String },
    _meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const FlashcardModel = mongoose.model<IFlashcardDocument>('Flashcard', FlashcardSchema);
