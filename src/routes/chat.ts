import { Router } from 'express';
import { getMessages, createMessage } from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { orderIdParamSchema, createMessageSchema } from '../types/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/:id/messages', validateParams(orderIdParamSchema), asyncHandler(getMessages));
router.post('/:id/messages', validateParams(orderIdParamSchema), validateBody(createMessageSchema), asyncHandler(createMessage));

export default router;
