import type { SrpHistoryEntry } from "@/shared/types/srp-history.types";

/**
 * Fixed samples for the component gallery's SRP history state demos only.
 * The Commodity List and Commodities pages read the real history from
 * `GET /api/v1/public/commodities/:id/srp-history`.
 */
export const SAMPLE_SRP_HISTORY: SrpHistoryEntry[] = [
  { id: "sample-1", price: 42, effectiveDate: "2024-11-04T00:00:00.000Z" },
  { id: "sample-2", price: 43.5, effectiveDate: "2025-03-17T00:00:00.000Z" },
  { id: "sample-3", price: 45.25, effectiveDate: "2025-08-01T00:00:00.000Z" },
  { id: "sample-4", price: 44.75, effectiveDate: "2025-12-15T00:00:00.000Z" },
  { id: "sample-5", price: 47, effectiveDate: "2026-06-09T00:00:00.000Z" },
];

export const SAMPLE_SINGLE_SRP_HISTORY: SrpHistoryEntry[] = [
  { id: "single-1", price: 36.25, effectiveDate: "2026-07-20T00:00:00.000Z" },
];
