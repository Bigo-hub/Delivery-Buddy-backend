import { Router } from 'express';
import { signup, login, logout } from '../controllers/authController';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { signupSchema, loginSchema } from '../types/schemas';

const router = Router();

router.post('/signup', validateBody(signupSchema), asyncHandler(signup));
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/logout', asyncHandler(logout));

export default router;
