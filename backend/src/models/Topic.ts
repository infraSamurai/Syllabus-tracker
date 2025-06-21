import { Schema, model, Document } from 'mongoose';

export interface ITopic extends Document {
  title: string;
  deadline: Date;
  notes: string;
  completed: boolean;
  completedAt: Date | null;
}

const TopicSchema = new Schema({
  title: { type: String, required: true },
  deadline: { type: Date, required: true },
  notes: { type: String },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

export default model<ITopic>('Topic', TopicSchema);
