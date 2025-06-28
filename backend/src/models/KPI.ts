import { Schema, model, Document, Types } from 'mongoose';

export interface IKPI extends Document {
  subject: Types.ObjectId;
  title: string;
  description?: string;
  target: number;
  currentValue: number;
  achieved: boolean;
  achievedAt?: Date;
  deadline: Date;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const KPISchema = new Schema<IKPI>({
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  description: { type: String },
  target: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  achieved: { type: Boolean, default: false },
  achievedAt: { type: Date },
  deadline: { type: Date, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  }
}, { timestamps: true });

export default model<IKPI>('KPI', KPISchema); 