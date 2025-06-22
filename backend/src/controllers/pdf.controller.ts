import { Request, Response, NextFunction } from 'express';
import { pdfService } from '../services/pdf.service';

export class PDFController {
  async generateWeeklyPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await pdfService.generateWeeklyReport();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="weekly-syllabus-report.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async generateMonthlyPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await pdfService.generateMonthlyReport();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="monthly-syllabus-report.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async generateDailyTaskPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: 'Date parameter is required' });
      }
      
      const pdfBuffer = await pdfService.generateDailyTaskPDF(date);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="daily-tasks-${date}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export const pdfController = new PDFController(); 