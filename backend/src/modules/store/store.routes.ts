import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { storeController } from './store.controller';

const router = Router();

router.use(authorize('ADMIN', 'OFFICER'));

router.post('/', asyncHandler(storeController.createStore));
router.get('/', asyncHandler(storeController.getStores));
router.get('/:id', asyncHandler(storeController.getStoreById));
router.put('/:id', asyncHandler(storeController.updateStore));
router.delete('/:id', asyncHandler(storeController.deleteStore));

export default router;
