import { Router } from 'express';
import { getWallet, getTransactions, withdraw } from '../controllers/walletController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { withdrawSchema } from '../types/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getWallet));
router.get('/transactions', asyncHandler(getTransactions));
router.post('/withdraw', validateBody(withdrawSchema), asyncHandler(withdraw));

export default router;
