import { auditLogRepository } from './audit-log.repository';
import type { AuditLogEntryDto, AuditLogWithActor, RecordAuditLogInput } from './audit-log.types';
import type { ListAuditLogsQuery } from './audit-log.schema';

export function toAuditLogEntryDto(entry: AuditLogWithActor): AuditLogEntryDto {
  return {
    id: entry.id,
    actorId: entry.actorId,
    actorName: entry.user.name,
    actorEmail: entry.user.email,
    actorRole: entry.user.role,
    action: entry.action,
    targetId: entry.targetId,
    metadata: entry.metadata,
    createdAt: entry.createdAt,
  };
}

export const auditLogService = {
  getAuditLogs: async (query: ListAuditLogsQuery) => {
    const { data, total, page, pageSize } = await auditLogRepository.findAll(query);
    return { data: data.map(toAuditLogEntryDto), total, page, pageSize };
  },
  record: (data: RecordAuditLogInput) => auditLogRepository.create(data),
};
