import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { commodityController } from './commodity.controller';

const router = Router();

router.post('/', authorize('ADMIN'), asyncHandler(commodityController.createCommodity));
router.get('/', asyncHandler(commodityController.getCommodities));
router.get('/:id', asyncHandler(commodityController.getCommodityById));
router.put('/:id', authorize('ADMIN'), asyncHandler(commodityController.updateCommodity));
router.delete('/:id', authorize('ADMIN'), asyncHandler(commodityController.deleteCommodity));

export default router;
