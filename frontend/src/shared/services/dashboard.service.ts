import { apiFetch } from "./api";
import type { DashboardAnalytics } from "@/shared/types/dashboard.types";

export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const response = await apiFetch<{ status: string; data: DashboardAnalytics }>(
    "/api/dashboard/analytics",
  );

  return response.data;
}
