import { Router } from 'express';
import { reportController } from '../controllers/report.controller';

const router = Router();

router.get('/weekly', reportController.generateWeeklyReport.bind(reportController));
router.get('/monthly', reportController.generateMonthlyReport.bind(reportController));

export default router; 