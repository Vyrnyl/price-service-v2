export type AuditAction =
  | "LOGIN"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "SRP_CREATE"
  | "SRP_UPDATE"
  | "PRICE_RECORD_DELETE";

export type AuditActorRole = "ADMIN" | "OFFICER";

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: AuditActorRole;
  action: AuditAction;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
