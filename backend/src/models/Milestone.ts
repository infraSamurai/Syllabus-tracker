import { Schema, model, Document, Types } from 'mongoose';

export interface IMilestone extends Document {
  title: string;
  description: string;
  criteria: {
    type: 'topics_completed' | 'subjects_completed' | 'streak_days' | 'kpis_achieved';
    value: number;
  };
  reward: {
    type: 'badge' | 'certificate' | 'points';
    value: string | number;
    imageUrl?: string;
  };
  unlockedBy: Types.ObjectId[];  // Array of user IDs who unlocked this
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  criteria: {
    type: { 
      type: String, 
      enum: ['topics_completed', 'subjects_completed', 'streak_days', 'kpis_achieved'],
      required: true 
    },
    value: { type: Number, required: true }
  },
  reward: {
    type: { 
      type: String, 
      enum: ['badge', 'certificate', 'points'],
      required: true 
    },
    value: { type: Schema.Types.Mixed, required: true },
    imageUrl: { type: String }
  },
  unlockedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default model<IMilestone>('Milestone', MilestoneSchema); 