import { apiFetch } from "@/shared/services/api";
import type { AuditLogEntry } from "../types/audit-log.types";

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const response = await apiFetch<{ status: string; data: AuditLogEntry[] }>("/api/audit-logs");

  return response.data;
}
