import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { commodityController } from './commodity.controller';

const router = Router();

router.post('/', authorize('OFFICER'), asyncHandler(commodityController.createCommodity));
router.get('/', asyncHandler(commodityController.getCommodities));
router.get('/:id', asyncHandler(commodityController.getCommodityById));
router.put('/:id', authorize('OFFICER'), asyncHandler(commodityController.updateCommodity));
router.delete('/:id', authorize('OFFICER'), asyncHandler(commodityController.deleteCommodity));

export default router;
