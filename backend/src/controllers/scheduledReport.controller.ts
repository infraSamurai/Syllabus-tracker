import { Request, Response, NextFunction } from 'express';
import ScheduledReport from '../models/ScheduledReport';
import { ReportSchedulerService } from '../services/reportScheduler.service';

export class ScheduledReportController {
  private schedulerService = new ReportSchedulerService();

  async getScheduledReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await ScheduledReport.find()
        .populate('createdBy', 'name email')
        .sort({ nextRun: 1 });
      
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }

  async createScheduledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const reportData = {
        ...req.body,
        createdBy: req.user?.id || req.body.createdBy,
        nextRun: this.calculateNextRun(req.body.schedule)
      };
      
      const report = new ScheduledReport(reportData);
      await report.save();
      
      // Schedule the report if active
      if (report.isActive) {
        this.schedulerService.scheduleReport(report);
      }
      
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }

  async updateScheduledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const report = await ScheduledReport.findByIdAndUpdate(id, req.body, { new: true });
      if (!report) {
        return res.status(404).json({ message: 'Scheduled report not found' });
      }
      
      // Update scheduler
      if (report.isActive) {
        this.schedulerService.scheduleReport(report);
      } else {
        this.schedulerService.stopReport(id);
      }
      
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async deleteScheduledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Stop the scheduled job
      this.schedulerService.stopReport(id);
      
      await ScheduledReport.findByIdAndDelete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async runReportNow(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const report = await ScheduledReport.findById(id);
      if (!report) {
        return res.status(404).json({ message: 'Scheduled report not found' });
      }
      
      // Execute report immediately
      // This would trigger the report generation and sending
      res.json({ message: 'Report execution started', reportId: id });
    } catch (error) {
      next(error);
    }
  }

  private calculateNextRun(schedule: any): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    const next = new Date();
    
    next.setHours(hours, minutes, 0, 0);
    
    // If time has already passed today, move to next occurrence
    if (next <= now) {
      switch (schedule.frequency) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
      }
    }
    
    return next;
  }
} 