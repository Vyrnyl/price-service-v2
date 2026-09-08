import { apiFetch } from "./api";
import type { DashboardAnalytics, StoreViolationPoint } from "@/shared/types/dashboard.types";

export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const response = await apiFetch<{ status: string; data: DashboardAnalytics }>(
    "/api/dashboard/analytics",
  );

  return response.data;
}

export interface StoreViolationsRange {
  startDate?: string;
  endDate?: string;
}

export async function fetchStoreViolations(range?: StoreViolationsRange): Promise<StoreViolationPoint[]> {
  const query = new URLSearchParams();
  if (range?.startDate) query.set("startDate", range.startDate);
  if (range?.endDate) query.set("endDate", range.endDate);

  const queryString = query.toString();
  const response = await apiFetch<{ status: string; data: StoreViolationPoint[] }>(
    queryString ? `/api/dashboard/store-violations?${queryString}` : "/api/dashboard/store-violations",
  );

  return response.data;
}
