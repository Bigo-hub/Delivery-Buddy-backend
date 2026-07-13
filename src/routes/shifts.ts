import { Router } from 'express';
import { startShift, stopShift, getCurrentShift, getShiftHistory } from '../controllers/shiftController';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.post('/start', asyncHandler(startShift));
router.post('/:id/stop', asyncHandler(stopShift));
router.get('/current', asyncHandler(getCurrentShift));
router.get('/', asyncHandler(getShiftHistory));

export default router;
