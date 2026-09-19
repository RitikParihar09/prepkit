import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduleDocument extends Document {
  kitId: mongoose.Types.ObjectId;
  daysAvailable: number;
  days: {
    day: number;
    focus: string;
    question_ids: string[];
    minutes: number;
    isCompleted?: boolean;
  }[];
}

const ScheduleSchema = new Schema(
  {
    kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true, unique: true },
    daysAvailable: { type: Number, required: true },
    days: [
      {
        day: { type: Number, required: true },
        focus: { type: String, required: true },
        question_ids: [{ type: String }],
        minutes: { type: Number, required: true },
        isCompleted: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
);

export const ScheduleModel = mongoose.model<IScheduleDocument>('Schedule', ScheduleSchema);
