import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(60, 'Keep it under 60 characters'),
});

export const updateCategorySchema = createCategorySchema;

export const categoryIdParamSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
