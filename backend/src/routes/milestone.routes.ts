import { Router } from 'express';
import { milestoneController } from '../controllers/milestone.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Get all milestones
router.get('/', milestoneController.getMilestones.bind(milestoneController));

// Get user's milestones
router.get('/my-milestones', protect, milestoneController.getUserMilestones.bind(milestoneController));

// Check for new milestone achievements
router.post('/check', protect, milestoneController.checkUserMilestones.bind(milestoneController));

// Admin routes
router.post('/', protect, authorize('admin'), milestoneController.createMilestone.bind(milestoneController));
router.patch('/:id', protect, authorize('admin'), milestoneController.updateMilestone.bind(milestoneController));
router.delete('/:id', protect, authorize('admin'), milestoneController.deleteMilestone.bind(milestoneController));

export default router; 