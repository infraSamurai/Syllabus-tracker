import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  teacher?: Types.ObjectId;
  class: Types.ObjectId;
  subject: Types.ObjectId;
  date: Date;
  title: string;
  completed: boolean;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  type: 'daily' | 'weekly' | 'monthly';
}

const TaskSchema = new Schema<ITask>({
  teacher: { type: Schema.Types.ObjectId, ref: 'User' },
  class: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: Date, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  notes: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  type: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema); 