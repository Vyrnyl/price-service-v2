import { apiFetch } from "@/shared/services/api";
import type { BackendReport, CreateReportPayload } from "./types";

export async function getReports() {
  return apiFetch<{ status: string; data: BackendReport[] }>("/api/reports", {
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
