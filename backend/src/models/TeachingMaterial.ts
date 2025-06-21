import { Schema, model, Document } from 'mongoose';

export interface ITeachingMaterial extends Document {
  title: string;
  type: 'document' | 'video' | 'presentation' | 'other';
  url: string;
  topic: Schema.Types.ObjectId;
  uploadedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teachingMaterialSchema = new Schema<ITeachingMaterial>({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['document', 'video', 'presentation', 'other'], 
    required: true 
  },
  url: { type: String, required: true },
  topic: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const TeachingMaterial = model<ITeachingMaterial>('TeachingMaterial', teachingMaterialSchema);
