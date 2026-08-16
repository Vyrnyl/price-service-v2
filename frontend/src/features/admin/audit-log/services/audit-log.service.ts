import { apiFetch } from "@/shared/services/api";
import type { PaginatedResponse } from "@/shared/types/pagination";
import type { AuditAction, AuditLogEntry } from "../types/audit-log.types";

export interface FetchAuditLogsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: AuditAction;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchAuditLogs(params: FetchAuditLogsParams = {}): Promise<PaginatedResponse<AuditLogEntry>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.action) query.set("action", params.action);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);

  const queryString = query.toString();
  return apiFetch<PaginatedResponse<AuditLogEntry>>(
    queryString ? `/api/audit-logs?${queryString}` : "/api/audit-logs",
  );
}
