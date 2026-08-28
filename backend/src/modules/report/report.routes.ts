import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { reportController } from './report.controller';

const router = Router();

router.use(authorize('ADMIN'));

router.post('/', asyncHandler(reportController.createReport));
router.get('/', asyncHandler(reportController.getReports));
router.delete('/', asyncHandler(reportController.deleteAllReports));
router.get('/:id', asyncHandler(reportController.getReportById));
router.get('/:id/download', asyncHandler(reportController.downloadReport));
router.put('/:id', asyncHandler(reportController.updateReport));
router.delete('/:id', asyncHandler(reportController.deleteReport));

export default router;
