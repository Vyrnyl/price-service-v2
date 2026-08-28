import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { CreateCommodityInput, ListCommoditiesQuery, UpdateCommodityInput } from './commodity.schema';
import { toSkipTake } from '../../shared/schema/pagination.schema';

export const commodityRepository = {
  create: (data: CreateCommodityInput) =>
    prisma.commodity.create({ data }),

  findAll: async (query: ListCommoditiesQuery) => {
    const { page, pageSize, search, status } = query;
    const { skip, take } = toSkipTake({ page, pageSize });

    const where: Prisma.CommodityWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.commodity.findMany({
        where,
        include: {
          srps: {
            orderBy: [
              { effectiveDate: "desc" },
              { createdAt: "desc" },
            ],
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      prisma.commodity.count({ where }),
    ]);

    return { data, total, page, pageSize };
  },

  findById: (id: string) =>
    prisma.commodity.findUnique({
      where: { id },
      include: {
        srps: {
          orderBy: [
            { effectiveDate: "desc" },
            { createdAt: "desc" },
          ],
          take: 1,
        },
      },
    }),

  update: (id: string, data: UpdateCommodityInput) =>
    prisma.commodity.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.commodity.delete({ where: { id } }),
};
