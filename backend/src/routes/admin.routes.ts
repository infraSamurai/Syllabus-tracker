import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
const adminController = new AdminController();

router.use(protect, authorize('admin'));

// Fix: Bind methods to maintain correct 'this' context
router.get('/dashboard-stats', adminController.getDashboardStats.bind(adminController));
router.get('/school-wide-progress', adminController.getSchoolWideProgress.bind(adminController));
router.get('/department-progress', adminController.getDepartmentProgress.bind(adminController));
router.get('/compliance-report', adminController.generateComplianceReport.bind(adminController));

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

export default router;