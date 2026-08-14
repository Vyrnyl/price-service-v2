import { auditLogRepository } from './audit-log.repository';
import type { AuditLogEntryDto, AuditLogWithActor, RecordAuditLogInput } from './audit-log.types';

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
  getAuditLogs: async (): Promise<AuditLogEntryDto[]> => {
    const entries = await auditLogRepository.findAll();
    return entries.map(toAuditLogEntryDto);
  },
  record: (data: RecordAuditLogInput) => auditLogRepository.create(data),
};
