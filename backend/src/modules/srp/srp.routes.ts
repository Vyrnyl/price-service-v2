import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { srpController } from './srp.controller';

const router = Router();

router.post('/', authorize('ADMIN'), asyncHandler(srpController.createSrp));
router.get('/', asyncHandler(srpController.getSrps));
router.get('/:id', asyncHandler(srpController.getSrpById));
router.put('/:id', authorize('ADMIN'), asyncHandler(srpController.updateSrp));
router.delete('/:id', authorize('ADMIN'), asyncHandler(srpController.deleteSrp));

export default router;
