import { prisma } from '../../prisma';
import AppError from '../../shared/utils/AppError';
import type { Prisma } from '@prisma/client';
import type { CreateSrpInput, UpdateSrpInput } from './srp.schema';

export const srpRepository = {
  create: (data: CreateSrpInput) => {
    const { commodityId, ...rest } = data;

    return prisma.sRP.create({
      data: {
        ...rest,
        commodity: {
          connect: { id: commodityId },
        },
      } as Prisma.SRPCreateInput,
      include: { commodity: true },
    });
  },

  findAll: () =>
    prisma.sRP.findMany({
      include: { commodity: true },
    }),

  findById: (id: string) =>
    prisma.sRP.findUnique({
      where: { id },
      include: { commodity: true },
    }),

  update: async (id: string, data: UpdateSrpInput) => {
    const { commodityId, ...rest } = data;

    // The schema compares the range ends only when both are sent; when one
    // side is omitted, compare against what is stored.
    if ((rest.effectiveDate === undefined) !== (rest.effectiveEndDate === undefined)) {
      const current = await prisma.sRP.findUnique({ where: { id }, select: { effectiveDate: true, effectiveEndDate: true } });
      const start = rest.effectiveDate ?? current?.effectiveDate;
      const end = rest.effectiveEndDate !== undefined ? rest.effectiveEndDate : current?.effectiveEndDate;
      if (start && end && end.getTime() < start.getTime()) {
        throw new AppError("End date can't be before the effective date", 400);
      }
    }

    const updateData: Prisma.SRPUpdateInput = {
      ...rest,
      ...(commodityId
        ? {
            commodity: {
              connect: { id: commodityId },
            },
          }
        : {}),
    };

    return prisma.sRP.update({
      where: { id },
      data: updateData,
      include: { commodity: true },
    });
  },

  delete: (id: string) =>
    prisma.sRP.delete({ where: { id } }),
};
