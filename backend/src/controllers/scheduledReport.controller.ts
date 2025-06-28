import { Request, Response, NextFunction } from 'express';
import ScheduledReport from '../models/ScheduledReport';
import { exportService } from '../services/export.service';
import { emailService } from '../services/email.service';

export class ScheduledReportController {
  async getScheduledReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await ScheduledReport.find()
        .populate('createdBy', 'name email')
        .populate('filters.classes', 'name')
        .populate('filters.subjects', 'name code')
        .sort({ createdAt: -1 });
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }

  async createScheduledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const reportData = {
        ...req.body,
        createdBy: req.user?.id
      };
      const report = new ScheduledReport(reportData);
      await report.save();
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }

  async updateScheduledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await ScheduledReport.findByIdAndUpdate(id, req.body, { 
        new: true, 
        runValidators: true 
      });
      if (!report) {
        return res.status(404).json({ message: 'Scheduled report not found' });
      }
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async deleteScheduledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await ScheduledReport.findByIdAndDelete(id);
      if (!report) {
        return res.status(404).json({ message: 'Scheduled report not found' });
      }
      res.json({ message: 'Scheduled report deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleReportStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await ScheduledReport.findById(id);
      if (!report) {
        return res.status(404).json({ message: 'Scheduled report not found' });
      }
      
      report.isActive = !report.isActive;
      await report.save();
      
      res.json({ 
        message: `Report ${report.isActive ? 'activated' : 'deactivated'} successfully`,
        report 
      });
    } catch (error) {
      next(error);
    }
  }

  async runScheduledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await ScheduledReport.findById(id)
        .populate('filters.classes')
        .populate('filters.subjects');
        
      if (!report) {
        return res.status(404).json({ message: 'Scheduled report not found' });
      }

      // Generate report based on type and format
      let reportData: Buffer;
      let fileName: string;
      
      switch (report.reportType) {
        case 'weekly':
          reportData = await exportService.generateWeeklyReport(report.format, report.filters);
          fileName = `weekly-report-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'monthly':
          reportData = await exportService.generateMonthlyReport(report.format, report.filters);
          fileName = `monthly-report-${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          // For custom or daily reports, use weekly as default
          reportData = await exportService.generateWeeklyReport(report.format, report.filters);
          fileName = `custom-report-${new Date().toISOString().split('T')[0]}`;
          break;
      }

      // Send to recipients
      if (report.recipients.length > 0) {
        await emailService.sendReportEmail(
          report.recipients,
          report.name,
          reportData,
          fileName,
          report.format
        );
      }

      // Update last run and calculate next run
      report.lastRun = new Date();
      await report.save();

      res.json({ 
        message: 'Report generated and sent successfully',
        lastRun: report.lastRun,
        nextRun: report.nextRun
      });
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingReports(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const upcomingReports = await ScheduledReport.find({
        isActive: true,
        nextRun: { $gte: now, $lte: tomorrow }
      })
      .populate('createdBy', 'name')
      .sort({ nextRun: 1 });

      res.json(upcomingReports);
    } catch (error) {
      next(error);
    }
  }
}

export const scheduledReportController = new ScheduledReportController(); 