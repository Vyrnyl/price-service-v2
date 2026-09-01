import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { RecordAuditLogInput } from './audit-log.types';
import type { ListAuditLogsQuery } from './audit-log.schema';
import { toSkipTake } from '../../shared/schema/pagination.schema';

export const auditLogRepository = {
  findAll: async (query: ListAuditLogsQuery) => {
    const { page, pageSize, action, dateFrom, dateTo } = query;
    const { skip, take } = toSkipTake({ page, pageSize });

    const where: Prisma.AuditLogWhereInput = {
      ...(action ? { action } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
              ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  },

  create: (data: RecordAuditLogInput) =>
    prisma.auditLog.create({
      data: {
        action: data.action,
        targetId: data.targetId,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        user: { connect: { id: data.actorId } },
      },
    }),
};
