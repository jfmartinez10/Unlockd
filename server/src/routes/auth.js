import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import {
    register,
    verifyEmail,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    me,
} from '../controllers/authController.js';

const router = Router();

router.post('/register',         authLimiter, register);
router.post('/verificar',                     verifyEmail);
router.post('/login',            authLimiter, login);
router.post('/refresh',                       refresh);
router.post('/logout',                        logout);
router.post('/forgot-password',  authLimiter, forgotPassword);
router.post('/reset-password',   authLimiter, resetPassword);
router.get('/me',                requireAuth, me);

export default router;
