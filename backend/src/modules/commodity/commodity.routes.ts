import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { commodityController } from './commodity.controller';

const router = Router();

router.post('/', authorize('OFFICER'), asyncHandler(commodityController.createCommodity));
router.get('/', asyncHandler(commodityController.getCommodities));
router.get('/:id', asyncHandler(commodityController.getCommodityById));
// Account roles only: a projected SRP on a public page could read as DTI announcing a future price.
router.get('/:id/srp-projection', authorize('ADMIN', 'OFFICER'), asyncHandler(commodityController.getSrpProjection));
router.put('/:id', authorize('OFFICER'), asyncHandler(commodityController.updateCommodity));
router.delete('/:id', authorize('OFFICER'), asyncHandler(commodityController.deleteCommodity));

export default router;
