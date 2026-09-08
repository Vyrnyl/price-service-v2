import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { dashboardController } from './dashboard.controller';

const router = Router();

router.get('/analytics', authorize('ADMIN', 'OFFICER'), asyncHandler(dashboardController.getAnalytics));
router.get('/store-violations', authorize('ADMIN', 'OFFICER'), asyncHandler(dashboardController.getStoreViolations));

export default router;
