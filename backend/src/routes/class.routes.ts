import { Router } from 'express';
import * as classController from '../controllers/class.controller';

const router = Router();

router.get('/', classController.getClasses);
router.post('/', classController.createClass);
router.patch('/:id', classController.updateClass);
router.delete('/:id', classController.deleteClass);

export default router; 