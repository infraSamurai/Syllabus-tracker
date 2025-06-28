import { Schema, model, Document, Types } from 'mongoose';

export interface IKPI extends Document {
  subject: Types.ObjectId;
  title: string;
  description?: string;
  target: number;
  current: number;
  unit: string;
  category: 'completion' | 'quality' | 'timeliness' | 'engagement';
  isAchieved: boolean;
  achievedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KPISchema = new Schema<IKPI>({
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  description: { type: String },
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  unit: { type: String, required: true }, // e.g., '%', 'topics', 'days'
  category: { 
    type: String, 
    enum: ['completion', 'quality', 'timeliness', 'engagement'],
    required: true 
  },
  isAchieved: { type: Boolean, default: false },
  achievedAt: { type: Date }
}, { timestamps: true });

// Auto-update achievement status
KPISchema.pre('save', function(next) {
  if (this.current >= this.target && !this.isAchieved) {
    this.isAchieved = true;
    this.achievedAt = new Date();
  } else if (this.current < this.target && this.isAchieved) {
    this.isAchieved = false;
    this.achievedAt = undefined;
  }
  next();
});

export default model<IKPI>('KPI', KPISchema); 