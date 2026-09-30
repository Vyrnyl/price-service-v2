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

/** `GET /api/v1/public/commodities/:id/srp-history` payload. */
export type SrpHistoryResponse = {
  commodityId: string;
  commodityName: string;
  category: string;
  /** Oldest first; one entry per effective date (the last one saved wins). */
  entries: SrpHistoryEntry[];
};
