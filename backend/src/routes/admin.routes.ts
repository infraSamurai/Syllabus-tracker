import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
const adminController = new AdminController();

router.use(protect, authorize('admin'));

router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/school-wide-progress', adminController.getSchoolWideProgress);
router.get('/department-progress', adminController.getDepartmentProgress);
router.get('/compliance-report', adminController.generateComplianceReport);

export default router;
