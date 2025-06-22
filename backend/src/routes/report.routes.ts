import { Router } from 'express';
import { reportController } from '../controllers/report.controller';

const router = Router();

router.get('/weekly', reportController.getWeeklyReport.bind(reportController));
router.get('/monthly', reportController.getMonthlyReport.bind(reportController));

export default router; 