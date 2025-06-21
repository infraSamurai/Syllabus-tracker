import { Schema, model, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
}, { timestamps: true });

export default model<IClass>('Class', ClassSchema); 