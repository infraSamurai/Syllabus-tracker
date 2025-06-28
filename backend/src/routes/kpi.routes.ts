import { Router } from 'express';
import { KPIController } from '../controllers/kpi.controller';

const router = Router();
const kpiController = new KPIController();

router.get('/', kpiController.getKPIs.bind(kpiController));
router.post('/', kpiController.createKPI.bind(kpiController));
router.patch('/:id', kpiController.updateKPI.bind(kpiController));
router.delete('/:id', kpiController.deleteKPI.bind(kpiController));
router.get('/analytics', kpiController.getKPIAnalytics.bind(kpiController));

export default router; 