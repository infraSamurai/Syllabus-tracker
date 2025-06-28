import { Router } from 'express';
import { MilestoneController } from '../controllers/milestone.controller';

const router = Router();
const milestoneController = new MilestoneController();

router.get('/', milestoneController.getMilestones.bind(milestoneController));
router.post('/', milestoneController.createMilestone.bind(milestoneController));
router.patch('/:id', milestoneController.updateMilestone.bind(milestoneController));
router.delete('/:id', milestoneController.deleteMilestone.bind(milestoneController));
router.post('/:id/check', milestoneController.checkMilestoneAchievement.bind(milestoneController));
router.get('/achievements/:userId', milestoneController.getUserAchievements.bind(milestoneController));

export default router; 