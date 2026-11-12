import { z } from "zod";
import { CATEGORY_ICON_KEYS } from "../category-icons";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(60, "Keep it under 60 characters"),
  // "" = Automatic: the icon is matched from the category name.
  iconKey: z.union([z.literal(""), z.enum(CATEGORY_ICON_KEYS)], { error: "Choose an icon from the list" }),
});

export const updateCategorySchema = createCategorySchema;

export type CreateCategoryFormSchema = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormSchema = z.infer<typeof updateCategorySchema>;
