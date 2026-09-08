import { categoryRepository } from './category.repository';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schema';

export const categoryService = {
  createCategory: (data: CreateCategoryInput) => categoryRepository.create(data),
  getCategories: () => categoryRepository.findAll(),
  getCategoryById: (id: string) => categoryRepository.findById(id),
  updateCategory: (id: string, data: UpdateCategoryInput) => categoryRepository.update(id, data),
  deleteCategory: (id: string) => categoryRepository.delete(id),
};
