import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { UpdateReportInput } from './report.schema';
import type { CreateReportWithFileInput } from './report.types';
import { resolveReportScope } from './report.scope';
import type { AuthUser } from '../../shared/types/express';

const reportSummarySelect = {
  id: true,
  type: true,
  generatedBy: true,
  period: true,
  filename: true,
  contentType: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true, email: true, role: true },
  },
} satisfies Prisma.ReportSelect;

export const reportRepository = {
  create: (data: CreateReportWithFileInput, userId: string) => {
    const { format, commodityGroup, storeId, ...rest } = data;

    return prisma.report.create({
      data: {
        ...rest,
        user: { connect: { id: userId } },
      } as Prisma.ReportCreateInput,
      select: reportSummarySelect,
    });
  },

  findAll: (authUser?: AuthUser) => {
    const scope = resolveReportScope(authUser);

    return prisma.report.findMany({
      where: scope,
      select: reportSummarySelect,
    });
  },

  findById: (id: string) =>
    prisma.report.findUnique({
      where: { id },
      select: reportSummarySelect,
    }),

  findFileById: (id: string) =>
    prisma.report.findUnique({
      where: { id },
      select: { filename: true, contentType: true, fileContent: true },
    }),

  deleteAll: (authUser?: AuthUser) => {
    const scope = resolveReportScope(authUser);

    return prisma.report.deleteMany({ where: scope });
  },

  update: (id: string, data: UpdateReportInput) => {
    const { format, commodityGroup, storeId, ...rest } = data;
    const updateData: Prisma.ReportUpdateInput = {
      ...rest,
    };

    return prisma.report.update({
      where: { id },
      data: updateData,
      select: reportSummarySelect,
    });
  },

  delete: (id: string) =>
    prisma.report.delete({ where: { id } }),
};
