import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { RecordAuditLogInput } from './audit-log.types';

const MAX_RESULTS = 500;

export const auditLogRepository = {
  findAll: () =>
    prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: MAX_RESULTS,
    }),

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
