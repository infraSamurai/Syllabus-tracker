import { Router } from 'express';
import { scheduledReportController } from '../controllers/scheduledReport.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Get all scheduled reports
router.get('/', protect, scheduledReportController.getScheduledReports.bind(scheduledReportController));

// Get upcoming reports (next 24 hours)
router.get('/upcoming', protect, scheduledReportController.getUpcomingReports.bind(scheduledReportController));

// Create new scheduled report
router.post('/', protect, scheduledReportController.createScheduledReport.bind(scheduledReportController));

// Update scheduled report
router.patch('/:id', protect, scheduledReportController.updateScheduledReport.bind(scheduledReportController));

// Toggle report active status
router.patch('/:id/toggle', protect, scheduledReportController.toggleReportStatus.bind(scheduledReportController));

// Manually run a scheduled report
router.post('/:id/run', protect, scheduledReportController.runScheduledReport.bind(scheduledReportController));

// Delete scheduled report
router.delete('/:id', protect, authorize('admin'), scheduledReportController.deleteScheduledReport.bind(scheduledReportController));

export default router; 