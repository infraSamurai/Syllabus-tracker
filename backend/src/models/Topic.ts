import { Schema, model, Document } from 'mongoose';

export interface ITopic extends Document {
  title: string;
  chapter: Schema.Types.ObjectId;
  plannedDate: Date;
  actualDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  teacherNotes?: string;
  needsRevision: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>({
  title: { type: String, required: true },
  chapter: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
  plannedDate: { type: Date, required: true },
  actualDate: { type: Date },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed'], 
    default: 'not_started' 
  },
  teacherNotes: { type: String },
  needsRevision: { type: Boolean, default: false },
}, { timestamps: true });

export const Topic = model<ITopic>('Topic', topicSchema);
