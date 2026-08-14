import type { AuditAction, Prisma } from '@prisma/client';

export interface RecordAuditLogInput {
  actorId: string;
  action: AuditAction;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export type AuditLogWithActor = Prisma.AuditLogGetPayload<{ include: { user: true } }>;

export interface AuditLogEntryDto {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: 'ADMIN' | 'OFFICER';
  action: AuditAction;
  targetId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}
