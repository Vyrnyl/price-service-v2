import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { userController } from './user.controller';

const router = Router();

router.use(authorize('ADMIN'));

router.post('/', asyncHandler(userController.createUser));
router.get('/', asyncHandler(userController.getUsers));
router.get('/:id', asyncHandler(userController.getUserById));
router.put('/:id', asyncHandler(userController.updateUser));
router.delete('/:id', asyncHandler(userController.deleteUser));

export default router;
