import {
  SRP_PROJECTION_MIN_ENTRIES,
  type SrpHistoryEntry,
  type SrpProjection,
} from "@/shared/types/srp-history.types";

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

const MOCK_HORIZON_DAYS = 30;
const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Component gallery only — a rough stand-in so the outlook's states can be
 * demoed without a signed-in session. The Commodities page reads the real one
 * from `GET /api/v1/commodities/:id/srp-projection` (a time-based trend; see
 * the backend's `buildSrpProjection`).
 */
export function mockSrpProjection(entries: SrpHistoryEntry[], now: number): SrpProjection | null {
  const inEffect = entries.filter((entry) => new Date(entry.effectiveDate).getTime() <= now);
  if (inEffect.length < SRP_PROJECTION_MIN_ENTRIES) {
    return null;
  }

  const first = inEffect[0].price;
  const current = inEffect[inEffect.length - 1].price;
  const averageStep = (current - first) / (inEffect.length - 1);

  return {
    currentPrice: current,
    projectedPrice: Number((current + averageStep).toFixed(2)),
    projectedDate: new Date(now + MOCK_HORIZON_DAYS * DAY_MS).toISOString(),
    horizonDays: MOCK_HORIZON_DAYS,
    confidence: 0.42,
    basedOn: inEffect.length,
  };
}
