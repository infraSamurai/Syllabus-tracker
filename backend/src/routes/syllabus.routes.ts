import { Router } from 'express';
import * as syllabusController from '../controllers/syllabus.controller';
// import { protect } from '../middleware/auth.middleware';

const router = Router();

// Note: I have commented out the 'protect' middleware for now.
// This will allow you to easily test the API from your new frontend.
// We can add it back once the frontend has an authentication flow.

// Routes for Subjects
router.get('/subjects', syllabusController.getSubjects);
router.post('/subjects', syllabusController.createSubject);
router.patch('/subjects/:subjectId', syllabusController.updateSubject);
router.delete('/subjects/:subjectId', syllabusController.deleteSubject);

// Routes for Chapters
router.post('/chapters', syllabusController.createChapter);
router.patch('/chapters/:chapterId', syllabusController.updateChapter);
router.delete('/chapters/:chapterId', syllabusController.deleteChapter);

// Routes for Topics
router.post('/topics', syllabusController.createTopic);
router.patch('/topics/:topicId', syllabusController.updateTopic);
router.delete('/topics/:topicId', syllabusController.deleteTopic);
router.patch('/topics/:topicId/toggle', syllabusController.toggleTopicCompletion);

export default router;