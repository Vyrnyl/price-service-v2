import { apiFetch } from "@/shared/services/api";
import type { PaginatedResponse } from "@/shared/types/pagination";
import type { BackendReport, CreateReportPayload } from "../types/report.types";

export async function getReports(page = 1, pageSize = 10) {
  return apiFetch<PaginatedResponse<BackendReport>>(`/api/reports?page=${page}&pageSize=${pageSize}`, {
    method: "GET",
    credentials: "include",
  });
}

export async function createReport(payload: CreateReportPayload) {
  return apiFetch<{ status: string; data: BackendReport }>("/api/reports", {
    method: "POST",
    body: payload,
    credentials: "include",
  });
}

export async function deleteAllReports() {
  return apiFetch<{ status: string; data: unknown }>("/api/reports", {
    method: "DELETE",
    credentials: "include",
  });
}
