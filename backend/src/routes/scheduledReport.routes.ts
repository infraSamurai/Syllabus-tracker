import { Router } from 'express';
import { ScheduledReportController } from '../controllers/scheduledReport.controller';

const router = Router();
const controller = new ScheduledReportController();

router.get('/', controller.getScheduledReports.bind(controller));
router.post('/', controller.createScheduledReport.bind(controller));
router.patch('/:id', controller.updateScheduledReport.bind(controller));
router.delete('/:id', controller.deleteScheduledReport.bind(controller));
router.post('/:id/run', controller.runReportNow.bind(controller));

export default router; 