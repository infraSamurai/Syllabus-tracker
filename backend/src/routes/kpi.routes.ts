import { Router } from 'express';
import { kpiController } from '../controllers/kpi.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Get all KPIs or filter by subject
router.get('/', kpiController.getKPIs.bind(kpiController));

// Get KPI dashboard
router.get('/dashboard', kpiController.getKPIDashboard.bind(kpiController));

// Create new KPI
router.post('/', protect, kpiController.createKPI.bind(kpiController));

// Update KPI
router.patch('/:id', protect, kpiController.updateKPI.bind(kpiController));

// Update KPI progress
router.patch('/:id/progress', protect, kpiController.updateProgress.bind(kpiController));

// Delete KPI
router.delete('/:id', protect, kpiController.deleteKPI.bind(kpiController));

export default router; 