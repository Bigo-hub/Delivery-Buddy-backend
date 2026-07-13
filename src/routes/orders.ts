import { Router } from 'express';
import { getOrders, getOrder, updateOrderStatus, getOrderRoute } from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { orderIdParamSchema, orderStatusUpdateSchema } from '../types/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getOrders));
router.get('/:id', validateParams(orderIdParamSchema), asyncHandler(getOrder));
router.patch('/:id/status', validateParams(orderIdParamSchema), validateBody(orderStatusUpdateSchema), asyncHandler(updateOrderStatus));
router.get('/:id/route', validateParams(orderIdParamSchema), asyncHandler(getOrderRoute));

export default router;
