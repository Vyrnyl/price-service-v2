import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { publicController } from './public.controller';

const router = Router();

router.get('/commodities', asyncHandler(publicController.getPublicCommodities));
router.get('/forecasts/:commodityId', asyncHandler(publicController.getPublicForecastByCommodityId));

export default router;
