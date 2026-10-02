import { calculateConfidence } from '../forecast/forecast.service';

/** SRPs change every few months, so a week ahead would almost always read "no change". */
export const SRP_PROJECTION_HORIZON_DAYS = 30;
/** Fewer SRPs than this and there is no pattern to project from. */
export const SRP_PROJECTION_MIN_ENTRIES = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SrpRevision {
  price: number;
  effectiveDate: Date;
}

export interface SrpProjectionDto {
  /** SRP in force at `now`; the projection starts from it. */
  currentPrice: number;
  projectedPrice: number;
  projectedDate: Date;
  horizonDays: number;
  /** 0–1, from the same formula Price Trends' forecast uses. */
  confidence: number;
  /** How many dated SRPs the estimate rests on. */
  basedOn: number;
}

/**
 * Where the SRP may be in `SRP_PROJECTION_HORIZON_DAYS` if it keeps moving the
 * way it has. `revisions` must already be one row per effective date.
 *
 * The rate is a least-squares slope of SRP against *time*, not per revision:
 * revisions are months apart and irregular, so "average change per revision"
 * would treat a two-week gap and a year-long one alike. The line is anchored at
 * the SRP in force today rather than read off the fit, so the estimate never
 * starts from a price DTI did not set.
 *
 * An SRP dated after `now` is scheduled, not in force, and is left out.
 * Returns `null` when there are too few SRPs to show a direction.
 */
export function buildSrpProjection(revisions: SrpRevision[], now: Date): SrpProjectionDto | null {
  const inEffect = revisions
    .filter((revision) => revision.effectiveDate.getTime() <= now.getTime())
    .filter((revision) => Number.isFinite(revision.price) && revision.price > 0)
    .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());

  if (inEffect.length < SRP_PROJECTION_MIN_ENTRIES) {
    return null;
  }

  const origin = inEffect[0].effectiveDate.getTime();
  const xs = inEffect.map((revision) => (revision.effectiveDate.getTime() - origin) / DAY_MS);
  const ys = inEffect.map((revision) => revision.price);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;

  let sxx = 0;
  let sxy = 0;
  for (let index = 0; index < xs.length; index += 1) {
    sxx += (xs[index] - meanX) ** 2;
    sxy += (xs[index] - meanX) * (ys[index] - meanY);
  }
  const slopePerDay = sxx === 0 ? 0 : sxy / sxx;

  const currentPrice = ys[ys.length - 1];
  const projectedPrice = Math.max(0.01, currentPrice + slopePerDay * SRP_PROJECTION_HORIZON_DAYS);

  return {
    currentPrice,
    projectedPrice: Number(projectedPrice.toFixed(2)),
    projectedDate: new Date(now.getTime() + SRP_PROJECTION_HORIZON_DAYS * DAY_MS),
    horizonDays: SRP_PROJECTION_HORIZON_DAYS,
    confidence: calculateConfidence(ys, SRP_PROJECTION_HORIZON_DAYS, SRP_PROJECTION_HORIZON_DAYS - 1),
    basedOn: inEffect.length,
  };
}
