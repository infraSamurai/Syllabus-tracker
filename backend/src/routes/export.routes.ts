import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { exportService } from '../services/export.service';

const router = Router();
const exportController = new ExportController();

router.post('/excel', exportController.exportToExcel.bind(exportController));
router.get('/csv', exportController.exportToCSV.bind(exportController));
router.get('/json', exportController.exportToJSON.bind(exportController));

// Export weekly report
router.get('/weekly/:format', async (req, res, next) => {
  try {
    const { format } = req.params;
    const filters = req.query;
    
    const buffer = await exportService.generateWeeklyReport(format, filters);
    
    const filename = `weekly-report-${new Date().toISOString().split('T')[0]}`;
    const contentType = getContentType(format);
    const extension = format === 'excel' ? 'xlsx' : format;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Export monthly report
router.get('/monthly/:format', async (req, res, next) => {
  try {
    const { format } = req.params;
    const filters = req.query;
    
    const buffer = await exportService.generateMonthlyReport(format, filters);
    
    const filename = `monthly-report-${new Date().toISOString().split('T')[0]}`;
    const contentType = getContentType(format);
    const extension = format === 'excel' ? 'xlsx' : format;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Export daily report
router.get('/daily/:format', async (req, res, next) => {
  try {
    const { format } = req.params;
    const filters = req.query;
    
    const buffer = await exportService.generateDailyReport(format, filters);
    
    const filename = `daily-report-${new Date().toISOString().split('T')[0]}`;
    const contentType = getContentType(format);
    const extension = format === 'excel' ? 'xlsx' : format;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

function getContentType(format: string): string {
  switch (format) {
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

export default router; 