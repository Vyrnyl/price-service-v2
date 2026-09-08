import { prisma } from '../../prisma';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schema';

export const categoryRepository = {
  create: (data: CreateCategoryInput) =>
    prisma.category.create({ data }),

  findAll: async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { commodities: true } } },
    });

    return categories.map(({ _count, ...category }) => ({
      ...category,
      commodityCount: _count.commodities,
    }));
  },

  findById: (id: string) =>
    prisma.category.findUnique({ where: { id } }),

  update: (id: string, data: UpdateCategoryInput) =>
    prisma.category.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.category.delete({ where: { id } }),
};
