import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Fix: Bind methods to maintain correct 'this' context
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

export default router;