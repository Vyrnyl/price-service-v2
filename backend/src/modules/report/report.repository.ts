import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { UpdateReportInput } from './report.schema';
import type { CreateReportWithFileInput } from './report.types';
import { resolveReportScope } from './report.scope';
import type { AuthUser } from '../../shared/types/express';
import { toSkipTake, type PaginationQuery } from '../../shared/schema/pagination.schema';

const reportSummarySelect = {
  id: true,
  type: true,
  generatedBy: true,
  period: true,
  filterLabel: true,
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

  findAll: async (authUser: AuthUser | undefined, query: PaginationQuery) => {
    const scope = resolveReportScope(authUser);
    const { skip, take } = toSkipTake(query);

    const [data, total] = await prisma.$transaction([
      prisma.report.findMany({
        where: scope,
        select: reportSummarySelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.report.count({ where: scope }),
    ]);

    return { data, total, page: query.page, pageSize: query.pageSize };
  },

  // `findFirst`, not `findUnique`: the scope is a second predicate alongside the
  // id, so a report outside the caller's scope reads as "not found" (404) rather
  // than being returned to whoever holds the UUID.
  findById: (id: string, authUser?: AuthUser) => {
    const scope = resolveReportScope(authUser);

    return prisma.report.findFirst({
      where: { id, ...scope },
      select: reportSummarySelect,
    });
  },

  findFileById: (id: string, authUser?: AuthUser) => {
    const scope = resolveReportScope(authUser);

    return prisma.report.findFirst({
      where: { id, ...scope },
      select: { filename: true, contentType: true, fileContent: true },
    });
  },

  deleteAll: (authUser?: AuthUser) => {
    const scope = resolveReportScope(authUser);

    return prisma.report.deleteMany({ where: scope });
  },

  // Writes carry the same scope as reads — otherwise an officer holding another
  // officer's UUID could still rename or delete it. No match raises Prisma
  // P2025, which `errorHandler` already maps to 404.
  update: (id: string, data: UpdateReportInput, authUser?: AuthUser) => {
    const { format, commodityGroup, storeId, ...rest } = data;
    const scope = resolveReportScope(authUser);
    const updateData: Prisma.ReportUpdateInput = {
      ...rest,
    };

    return prisma.report.update({
      where: { id, ...scope },
      data: updateData,
      select: reportSummarySelect,
    });
  },

  delete: (id: string, authUser?: AuthUser) => {
    const scope = resolveReportScope(authUser);

    return prisma.report.delete({ where: { id, ...scope } });
  },
};
