import { Schema, model, Document, Types } from 'mongoose';
import { IChapter } from './Chapter';

export interface ISubject extends Document {
  name: string;
  code: string;
  department: string;
  description: string;
  deadline: Date;
  class: Types.ObjectId;
  chapters: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  code: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  class: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  chapters: [{ type: Schema.Types.ObjectId, ref: 'Chapter' }],
}, { timestamps: true });

export default model<ISubject>('Subject', SubjectSchema);
