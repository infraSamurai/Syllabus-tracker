import { Router } from 'express';
import * as topicController from '../controllers/topic.controller';

const router = Router();

// ... other topic routes ...
router.patch('/:id/toggle', topicController.toggleTopicCompletion);

export default router; 