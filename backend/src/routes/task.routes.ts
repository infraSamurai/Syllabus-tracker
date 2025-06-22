import { Router } from 'express';
import { taskController } from '../controllers/task.controller';

const router = Router();

// Generate daily tasks from syllabus
router.post('/generate', taskController.generateDailyTasks.bind(taskController));
// List tasks for a teacher/date
router.get('/', taskController.getTasks.bind(taskController));
// Mark a task as complete
router.patch('/:id/complete', taskController.markComplete.bind(taskController));
// Add a note to a task
router.patch('/:id/note', taskController.addNote.bind(taskController));
// Basic CRUD
router.post('/', taskController.createTask.bind(taskController));
router.patch('/:id', taskController.updateTask.bind(taskController));
router.delete('/:id', taskController.deleteTask.bind(taskController));

export default router; 