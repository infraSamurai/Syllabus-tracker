import { Schema, model, Document } from 'mongoose';

export interface IChapter extends Document {
  title: string;
  number: number;
  subject: Schema.Types.ObjectId;
  totalTopics: number;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema<IChapter>({
  title: { type: String, required: true },
  number: { type: Number, required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  totalTopics: { type: Number, default: 0 },
  plannedStartDate: { type: Date, required: true },
  plannedEndDate: { type: Date, required: true },
  actualStartDate: { type: Date },
  actualEndDate: { type: Date },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed'], 
    default: 'not_started' 
  },
}, { timestamps: true });

export const Chapter = model<IChapter>('Chapter', chapterSchema);
