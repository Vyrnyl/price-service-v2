import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { CreateCommodityInput, ListCommoditiesQuery, UpdateCommodityInput } from './commodity.schema';
import { toSkipTake } from '../../shared/schema/pagination.schema';

const commodityInclude = {
  srps: {
    orderBy: [
      { effectiveDate: 'desc' as const },
      { createdAt: 'desc' as const },
    ],
    take: 1,
  },
  category: true,
};

export const commodityRepository = {
  create: (data: CreateCommodityInput) => {
    const { srpPrice, srpEffectiveDate, ...commodityData } = data;

    return prisma.commodity.create({
      data: {
        ...commodityData,
        ...(srpPrice !== undefined && srpEffectiveDate !== undefined
          ? { srps: { create: [{ price: srpPrice, effectiveDate: srpEffectiveDate }] } }
          : {}),
      },
      include: commodityInclude,
    });
  },

  findAll: async (query: ListCommoditiesQuery) => {
    const { page, pageSize, search, status } = query;
    const { skip, take } = toSkipTake({ page, pageSize });

    const where: Prisma.CommodityWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.commodity.findMany({
        where,
        include: commodityInclude,
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
      include: commodityInclude,
    }),

  findByNameCaseInsensitive: (name: string) =>
    prisma.commodity.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true, name: true },
    }),

  update: (id: string, data: UpdateCommodityInput) =>
    prisma.commodity.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.commodity.delete({ where: { id } }),
};
