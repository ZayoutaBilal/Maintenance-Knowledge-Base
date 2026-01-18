import { Router } from 'express';
import {register, login, logout, getCurrentUser, resetPassword} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getCurrentUser);

export default router;