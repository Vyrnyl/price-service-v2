import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { priceRecordController } from './price-record.controller';

const router = Router();

router.use(authorize('ADMIN', 'OFFICER'));

router.post('/', asyncHandler(priceRecordController.createPriceRecord));
router.get('/', asyncHandler(priceRecordController.getPriceRecords));
router.get('/:id', asyncHandler(priceRecordController.getPriceRecordById));
router.put('/:id', asyncHandler(priceRecordController.updatePriceRecord));
router.delete('/:id', asyncHandler(priceRecordController.deletePriceRecord));

export default router;
