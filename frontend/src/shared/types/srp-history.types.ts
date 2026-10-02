/**
 * One SRP as DTI set it. Mirrors a row of the backend `SRP` table, which
 * already keeps every revision as its own dated row — editing a commodity's
 * SRP inserts a new row rather than overwriting the old one.
 */
export type SrpHistoryEntry = {
  id: string;
  price: number;
  /** ISO date the SRP took effect; it holds until the next entry's date. */
  effectiveDate: string;
};

/**
 * Where the SRP may be headed if DTI keeps revising it the way it has. An
 * estimate drawn from past SRP changes — never an SRP DTI has set.
 */
export type SrpProjection = {
  /** SRP in force today; the projection starts from it. */
  currentPrice: number;
  projectedPrice: number;
  /** ISO date the projected SRP is estimated for. */
  projectedDate: string;
  /** How far ahead `projectedDate` is from today. */
  horizonDays: number;
  /** 0–1. */
  confidence: number;
  /** How many dated SRPs the estimate rests on. */
  basedOn: number;
};

/** The outlook loads separately from the history, so it carries its own state. */
export type SrpProjectionState = {
  /** `null` once loaded means there is too little history to project from. */
  projection: SrpProjection | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
};

/** `GET /api/v1/commodities/:id/srp-projection` payload (ADMIN/OFFICER). */
export type SrpProjectionResponse = {
  commodityId: string;
  /** `null` when fewer than `SRP_PROJECTION_MIN_ENTRIES` SRPs are in force. */
  projection: SrpProjection | null;
};

/** Fewer SRPs than this and there is no pattern to project from. Mirrors the backend. */
export const SRP_PROJECTION_MIN_ENTRIES = 3;

/** `GET /api/v1/public/commodities/:id/srp-history` payload. */
export type SrpHistoryResponse = {
  commodityId: string;
  commodityName: string;
  category: string;
  /** Oldest first; one entry per effective date (the last one saved wins). */
  entries: SrpHistoryEntry[];
};
