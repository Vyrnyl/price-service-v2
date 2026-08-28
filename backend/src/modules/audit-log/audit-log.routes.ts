import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { auditLogController } from './audit-log.controller';

const router = Router();

router.use(authorize('ADMIN'));

router.get('/', asyncHandler(auditLogController.getAuditLogs));

export default router;
