import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  class: Types.ObjectId;
  subject: Types.ObjectId;
  date: Date;
  title: string;
  completed: boolean;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  class: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: Date, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  notes: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

export default model<ITask>('Task', TaskSchema); 