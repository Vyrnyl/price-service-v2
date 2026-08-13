import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { forecastController } from './forecast.controller';

const router = Router();

router.use(authorize('ADMIN', 'OFFICER'));

router.post('/generate', asyncHandler(forecastController.generateForecast));
router.post('/', asyncHandler(forecastController.createForecast));
router.get('/', asyncHandler(forecastController.getForecasts));
router.get('/:id', asyncHandler(forecastController.getForecastById));
router.put('/:id', asyncHandler(forecastController.updateForecast));
router.delete('/:id', asyncHandler(forecastController.deleteForecast));

export default router;
