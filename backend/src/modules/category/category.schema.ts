import { z } from 'zod';

// Icon keys a category may store. Mirrors CATEGORY_ICONS in
// frontend/src/features/category/category-icons.ts — keep both in sync.
export const CATEGORY_ICON_KEYS = [
  'cannedFish',
  'milk',
  'powderedMilk',
  'coffee',
  'bread',
  'noodles',
  'salt',
  'water',
  'laundry',
  'candles',
  'cannedMeat',
  'cornedBeef',
  'condiments',
  'soap',
  'batteries',
  'other',
] as const;

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(60, 'Keep it under 60 characters'),
  // "" or null = Automatic (icon matched from the name, stored as NULL);
  // omitted = leave as it is (on update) / Automatic (on create).
  iconKey: z.preprocess(
    (value) => (value === '' ? null : value),
    z.enum(CATEGORY_ICON_KEYS, { error: 'Choose an icon from the list' }).nullable().optional(),
  ),
});

export const updateCategorySchema = createCategorySchema;

export const categoryIdParamSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
