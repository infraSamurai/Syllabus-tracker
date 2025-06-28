import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();
const analyticsController = new AnalyticsController();

router.get('/trends', analyticsController.getTrendAnalysis.bind(analyticsController));
router.get('/forecast', analyticsController.getForecast.bind(analyticsController));
router.get('/comparative', analyticsController.getComparativeAnalysis.bind(analyticsController));

export default router; 