import { Router } from 'express';
import { asyncHandler } from '../../shared/handlers/asyncHandler';
import { authorize } from '../../shared/middleware/authorize';
import { categoryController } from './category.controller';

const router = Router();

router.post('/', authorize('OFFICER'), asyncHandler(categoryController.createCategory));
router.get('/', asyncHandler(categoryController.getCategories));
router.get('/:id', asyncHandler(categoryController.getCategoryById));
router.put('/:id', authorize('OFFICER'), asyncHandler(categoryController.updateCategory));
router.delete('/:id', authorize('OFFICER'), asyncHandler(categoryController.deleteCategory));

export default router;
