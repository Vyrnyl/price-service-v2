import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { categoryService } from './category.service';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from './category.schema';

export const categoryController = {
  createCategory: async (req: Request, res: Response) => {
    const validated = createCategorySchema.parse(req.body);
    const category = await categoryService.createCategory(validated);

    res.status(201).json({ status: 'success', data: category });
  },

  getCategories: async (_req: Request, res: Response) => {
    const categories = await categoryService.getCategories();

    res.json({ status: 'success', data: categories });
  },

  getCategoryById: async (req: Request, res: Response) => {
    const { id } = categoryIdParamSchema.parse(req.params);
    const category = await categoryService.getCategoryById(id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.json({ status: 'success', data: category });
  },

  updateCategory: async (req: Request, res: Response) => {
    const { id } = categoryIdParamSchema.parse(req.params);
    const data = updateCategorySchema.parse(req.body);

    const updatedCategory = await categoryService.updateCategory(id, data);

    res.json({ status: 'success', data: updatedCategory });
  },

  deleteCategory: async (req: Request, res: Response) => {
    const { id } = categoryIdParamSchema.parse(req.params);

    await categoryService.deleteCategory(id);

    res.status(204).send();
  },
};
