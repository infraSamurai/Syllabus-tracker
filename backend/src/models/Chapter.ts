import { Schema, model, Document } from 'mongoose';
import { ITopic } from './Topic';

export interface IChapter extends Document {
  title: string;
  number: number;
  description: string;
  deadline: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  topics: ITopic['_id'][];
}

const ChapterSchema = new Schema({
  title: { type: String, required: true },
  number: { type: Number, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started' 
  },
  topics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
}, { timestamps: true });

export default model<IChapter>('Chapter', ChapterSchema);
