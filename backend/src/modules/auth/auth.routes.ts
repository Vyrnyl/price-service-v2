import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/authenticate';

const router = Router();

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authController.logout);

export default router;
