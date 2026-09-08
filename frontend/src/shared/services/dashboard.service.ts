import { apiFetch } from "./api";
import type { DashboardAnalytics, StoreViolationPoint } from "@/shared/types/dashboard.types";

export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const response = await apiFetch<{ status: string; data: DashboardAnalytics }>(
    "/api/dashboard/analytics",
  );

  return response.data;
}

export async function fetchStoreViolations(): Promise<StoreViolationPoint[]> {
  const response = await apiFetch<{ status: string; data: StoreViolationPoint[] }>(
    "/api/dashboard/store-violations",
  );

  return response.data;
}
