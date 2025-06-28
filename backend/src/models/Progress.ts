import { Schema, model, Document, Types } from 'mongoose';

export interface IProgress extends Document {
  subject: Types.ObjectId;
  teacher: Types.ObjectId;
  totalChapters: number;
  completedChapters: number;
  totalTopics: number;
  completedTopics: number;
  percentageComplete: number;
  lastUpdated: Date;
  isOnTrack: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>({
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  totalChapters: { type: Number, required: true },
  completedChapters: { type: Number, default: 0 },
  totalTopics: { type: Number, required: true },
  completedTopics: { type: Number, default: 0 },
  percentageComplete: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  isOnTrack: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IProgress>('Progress', progressSchema);
