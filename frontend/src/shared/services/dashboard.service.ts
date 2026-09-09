import { apiFetch } from "./api";
import type { DashboardAnalytics, StoreViolationPoint } from "@/shared/types/dashboard.types";

export interface DashboardAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  /** Narrows the price-trend line only; the ranking charts always show all commodities. */
  commodityId?: string;
}

export async function fetchDashboardAnalytics(
  filters?: DashboardAnalyticsFilters,
): Promise<DashboardAnalytics> {
  const query = new URLSearchParams();
  if (filters?.startDate) query.set("startDate", filters.startDate);
  if (filters?.endDate) query.set("endDate", filters.endDate);
  if (filters?.commodityId) query.set("commodityId", filters.commodityId);

  const queryString = query.toString();
  const response = await apiFetch<{ status: string; data: DashboardAnalytics }>(
    queryString ? `/api/dashboard/analytics?${queryString}` : "/api/dashboard/analytics",
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
