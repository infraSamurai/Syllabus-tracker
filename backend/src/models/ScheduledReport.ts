import { Schema, model, Document, Types } from 'mongoose';

export interface IScheduledReport extends Document {
  name: string;
  description?: string;
  reportType: 'weekly' | 'monthly' | 'custom';
  customTemplate?: object;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filters?: object;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledReportSchema = new Schema<IScheduledReport>({
  name: { type: String, required: true },
  description: { type: String },
  reportType: { 
    type: String, 
    enum: ['weekly', 'monthly', 'custom'], 
    required: true 
  },
  customTemplate: { type: Schema.Types.Mixed },
  schedule: {
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly'], 
      required: true 
    },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    time: { type: String, required: true }
  },
  recipients: [{ type: String }],
  format: { 
    type: String, 
    enum: ['pdf', 'excel', 'csv', 'json'], 
    default: 'pdf' 
  },
  filters: { type: Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },
  lastRun: { type: Date },
  nextRun: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default model<IScheduledReport>('ScheduledReport', ScheduledReportSchema); 