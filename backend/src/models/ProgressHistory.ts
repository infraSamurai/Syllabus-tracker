import { Schema, model, Document, Types } from 'mongoose';

export interface IProgressHistory extends Document {
  subject: Types.ObjectId;
  date: Date;
  percentageComplete: number;
  topicsCompleted: number;
  totalTopics: number;
  chaptersCompleted: number;
  totalChapters: number;
  kpisAchieved: number;
  totalKpis: number;
  predictedCompletionDate?: Date;
  notes?: string;
}

const ProgressHistorySchema = new Schema<IProgressHistory>({
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: Date, required: true },
  percentageComplete: { type: Number, required: true },
  topicsCompleted: { type: Number, required: true },
  totalTopics: { type: Number, required: true },
  chaptersCompleted: { type: Number, required: true },
  totalChapters: { type: Number, required: true },
  kpisAchieved: { type: Number, default: 0 },
  totalKpis: { type: Number, default: 0 },
  predictedCompletionDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

// Create compound index for efficient queries
ProgressHistorySchema.index({ subject: 1, date: -1 });

export default model<IProgressHistory>('ProgressHistory', ProgressHistorySchema); 