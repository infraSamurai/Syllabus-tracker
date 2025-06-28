import { Schema, model, Document, Types } from 'mongoose';

export interface IMilestone extends Document {
  name: string;
  description: string;
  type: 'progress' | 'completion' | 'kpi' | 'custom';
  target: number;
  reward: {
    type: 'badge' | 'certificate' | 'points' | 'custom';
    value: string;
    points?: number;
  };
  conditions: {
    metric: string;
    operator: 'equals' | 'greater' | 'less' | 'between';
    value: number;
    value2?: number;
  }[];
  achievedBy: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['progress', 'completion', 'kpi', 'custom'], 
    required: true 
  },
  target: { type: Number, required: true },
  reward: {
    type: { 
      type: String, 
      enum: ['badge', 'certificate', 'points', 'custom'], 
      required: true 
    },
    value: { type: String, required: true },
    points: { type: Number }
  },
  conditions: [{
    metric: { type: String, required: true },
    operator: { 
      type: String, 
      enum: ['equals', 'greater', 'less', 'between'], 
      required: true 
    },
    value: { type: Number, required: true },
    value2: { type: Number }
  }],
  achievedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default model<IMilestone>('Milestone', MilestoneSchema); 