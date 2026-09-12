import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleDocument extends Document {
  kitId: mongoose.Types.ObjectId;
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: {
    id: string;
    text: string;
    kind: 'technical' | 'behavioural' | 'domain';
    priority: 'must' | 'nice';
  }[];
}

const RoleSchema = new Schema(
  {
    kitId: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true, unique: true },
    title: { type: String, required: true },
    seniority: { type: String },
    responsibilities: [{ type: String }],
    requirements: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        kind: { type: String, enum: ['technical', 'behavioural', 'domain'], required: true },
        priority: { type: String, enum: ['must', 'nice'], required: true }
      }
    ]
  },
  { timestamps: true }
);

export const RoleModel = mongoose.model<IRoleDocument>('Role', RoleSchema);
