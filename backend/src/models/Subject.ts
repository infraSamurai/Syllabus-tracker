import { Schema, model, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  grade: string;
  department: string;
  totalChapters: number;
  plannedCompletionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  grade: { type: String, required: true },
  department: { type: String, required: true },
  totalChapters: { type: Number, default: 0 },
  plannedCompletionDate: { type: Date, required: true },
}, { timestamps: true });

export const Subject = model<ISubject>('Subject', subjectSchema);
