import { Router } from 'express';
import { getMe, updateProfile, updateSettings } from '../controllers/courierController';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { updateProfileSchema, updateSettingsSchema } from '../types/schemas';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/me', asyncHandler(getMe));
router.put('/me/profile', validateBody(updateProfileSchema), asyncHandler(updateProfile));
router.patch('/me/settings', validateBody(updateSettingsSchema), asyncHandler(updateSettings));

export default router;
