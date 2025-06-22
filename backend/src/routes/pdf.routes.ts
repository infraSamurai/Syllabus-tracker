import { Router } from 'express';
import { pdfController } from '../controllers/pdf.controller';

const router = Router();

// Generate and download weekly PDF report
router.get('/weekly', pdfController.generateWeeklyPDF);

// Generate and download monthly PDF report
router.get('/monthly', pdfController.generateMonthlyPDF);

// Generate and download daily task PDF report
router.get('/daily-tasks', pdfController.generateDailyTaskPDF);

export default router; 