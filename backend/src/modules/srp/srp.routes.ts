import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { srpController } from './srp.controller';

const router = Router();

router.post('/', authorize('OFFICER'), asyncHandler(srpController.createSrp));
router.get('/', asyncHandler(srpController.getSrps));
router.get('/:id', asyncHandler(srpController.getSrpById));
router.put('/:id', authorize('OFFICER'), asyncHandler(srpController.updateSrp));
router.delete('/:id', authorize('OFFICER'), asyncHandler(srpController.deleteSrp));

export default router;
