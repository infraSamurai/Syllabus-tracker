import cron from 'node-cron';
import ScheduledReport from '../models/ScheduledReport';
import { pdfService } from './pdf.service';
import { ExportController } from '../controllers/export.controller';
import nodemailer from 'nodemailer';

export class ReportSchedulerService {
  private jobs: Map<string, any> = new Map();
  private exportController = new ExportController();
  
  async initializeScheduledReports() {
    const activeReports = await ScheduledReport.find({ isActive: true });
    
    for (const report of activeReports) {
      this.scheduleReport(report);
    }
  }
  
  scheduleReport(report: any) {
    // Convert schedule to cron expression
    const cronExpression = this.buildCronExpression(report.schedule);
    
    if (this.jobs.has(report._id.toString())) {
      this.jobs.get(report._id.toString())?.stop();
    }
    
    const job = cron.schedule(cronExpression, async () => {
      await this.executeReport(report);
    });
    
    this.jobs.set(report._id.toString(), job);
  }
  
  private buildCronExpression(schedule: any): string {
    const [hours, minutes] = schedule.time.split(':');
    
    switch (schedule.frequency) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        return `${minutes} ${hours} * * ${schedule.dayOfWeek}`;
      case 'monthly':
        return `${minutes} ${hours} ${schedule.dayOfMonth} * *`;
      default:
        return '0 0 * * *'; // Default to daily at midnight
    }
  }
  
  private async executeReport(report: any) {
    try {
      // Generate report based on type
      let reportBuffer: Buffer;
      
      switch (report.reportType) {
        case 'weekly':
          reportBuffer = await pdfService.generateWeeklyReport();
          break;
        case 'monthly':
          reportBuffer = await pdfService.generateMonthlyReport();
          break;
        case 'custom':
          // TODO: Implement custom report generation
          reportBuffer = Buffer.from('Custom report not implemented');
          break;
        default:
          throw new Error('Unknown report type');
      }
      
      // Send report to recipients
      await this.sendReport(report, reportBuffer);
      
      // Update last run and next run
      report.lastRun = new Date();
      report.nextRun = this.calculateNextRun(report.schedule);
      await report.save();
    } catch (error) {
      console.error('Error executing scheduled report:', error);
    }
  }
  
  private async sendReport(report: any, buffer: Buffer) {
    // Configure email transporter (you'll need to set up SMTP settings)
    const transporter = nodemailer.createTransport({
      // Add your SMTP configuration here
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@syllabusracker.com',
      to: report.recipients.join(', '),
      subject: `Scheduled Report: ${report.name}`,
      text: `Please find attached your scheduled report: ${report.name}`,
      attachments: [{
        filename: `${report.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${report.format}`,
        content: buffer
      }]
    };
    
    await transporter.sendMail(mailOptions);
  }
  
  private calculateNextRun(schedule: any): Date {
    const now = new Date();
    const next = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    switch (schedule.frequency) {
      case 'daily':
        next.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(now.getMonth() + 1);
        next.setDate(schedule.dayOfMonth);
        break;
    }
    
    next.setHours(hours, minutes, 0, 0);
    return next;
  }
  
  stopReport(reportId: string) {
    const job = this.jobs.get(reportId);
    if (job) {
      job.stop();
      this.jobs.delete(reportId);
    }
  }
} 