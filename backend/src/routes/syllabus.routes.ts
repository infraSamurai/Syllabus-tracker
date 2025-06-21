import { Router } from 'express';
import { SyllabusController } from '../controllers/syllabus.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
const syllabusController = new SyllabusController();

router.put('/topics/:topicId/progress', protect, authorize('teacher'), syllabusController.updateTopicProgress);
router.get('/subjects/:subjectId/progress', protect, authorize('teacher', 'admin'), syllabusController.getSubjectProgress);

export default router;
