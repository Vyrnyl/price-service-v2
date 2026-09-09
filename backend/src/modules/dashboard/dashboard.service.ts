import { dashboardRepository, type DashboardDateRange } from './dashboard.repository';
import type { AuthUser } from '../../shared/types/express';
import type {
  CommodityComparisonPoint,
  CommodityOption,
  DashboardAnalytics,
  PriceTrendPoint,
  SrpVsActualPoint,
  StoreViolationPoint,
} from './dashboard.types';

export type PriceRecordForAnalytics = Awaited<
  ReturnType<typeof dashboardRepository.findRecentPriceRecords>
>[number];

export type PriceRecordWithStoreForAnalytics = Awaited<
  ReturnType<typeof dashboardRepository.findRecentPriceRecordsWithStore>
>[number];

/**
 * Dashboard charts are summaries, not exhaustive views — the full data lives in
 * Price Trends and the reports module. Both bar charts render into a fixed 288px
 * box, so past roughly a dozen commodities the bars thin to hairlines and the
 * axis labels start colliding. Cap them at a readable Top N.
 */
export const DASHBOARD_CHART_LIMIT = 10;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildPriceTrend(records: PriceRecordForAnalytics[]): PriceTrendPoint[] {
  const totalsByDay = new Map<string, { sum: number; count: number }>();

  for (const record of records) {
    const day = record.dateAndTime.toISOString().slice(0, 10);
    const bucket = totalsByDay.get(day) ?? { sum: 0, count: 0 };
    bucket.sum += record.price.toNumber();
    bucket.count += 1;
    totalsByDay.set(day, bucket);
  }

  return [...totalsByDay.entries()]
    .sort(([dayA], [dayB]) => (dayA < dayB ? -1 : 1))
    .map(([date, bucket]) => ({ date, averagePrice: round2(bucket.sum / bucket.count) }));
}

export function buildCommodityComparison(records: PriceRecordForAnalytics[]): CommodityComparisonPoint[] {
  const totalsByCommodity = new Map<string, { name: string; sum: number; count: number }>();

  for (const record of records) {
    const bucket = totalsByCommodity.get(record.commodityId) ?? {
      name: record.commodity.name,
      sum: 0,
      count: 0,
    };
    bucket.sum += record.price.toNumber();
    bucket.count += 1;
    totalsByCommodity.set(record.commodityId, bucket);
  }

  return [...totalsByCommodity.entries()]
    .map(([commodityId, bucket]) => ({
      commodityId,
      commodityName: bucket.name,
      averagePrice: round2(bucket.sum / bucket.count),
    }))
    .sort((a, b) => b.averagePrice - a.averagePrice);
}

/**
 * The commodity picker offers only commodities that actually have records in the
 * selected window and the caller's own scope, so an officer never sees a name
 * that would render an empty trend line for them. Derived from the records
 * already fetched for the charts rather than a second query.
 */
export function buildCommodityOptions(records: PriceRecordForAnalytics[]): CommodityOption[] {
  const namesById = new Map<string, string>();

  for (const record of records) {
    if (!namesById.has(record.commodityId)) {
      namesById.set(record.commodityId, record.commodity.name);
    }
  }

  return [...namesById.entries()]
    .map(([commodityId, name]) => ({ commodityId, commodityName: name }))
    .sort((a, b) => a.commodityName.localeCompare(b.commodityName));
}

/**
 * Ranks commodities by how far their recorded average sits above SRP, worst
 * first. Ordering by price alone would surface whatever happens to be expensive
 * rather than what is actually overpriced, which is the decision this chart
 * exists to support. Commodities trading at or below SRP still rank (negative
 * margin), so the chart stays populated when nothing is in violation.
 */
export function buildSrpVsActual(
  comparison: CommodityComparisonPoint[],
  srpByCommodity: Map<string, number>,
): SrpVsActualPoint[] {
  return comparison
    .filter((point) => srpByCommodity.has(point.commodityId))
    .map((point) => ({
      commodityId: point.commodityId,
      commodityName: point.commodityName,
      srp: srpByCommodity.get(point.commodityId) as number,
      actualAverage: point.averagePrice,
    }))
    .sort((a, b) => b.actualAverage - b.srp - (a.actualAverage - a.srp));
}

/**
 * Counts each store's SRP violations over the trailing window, worst-first.
 * Reuses `PriceRecord.status`, computed at write time by D-8's range-based
 * compliance rule — this does not re-derive compliance from price vs. SRP, so
 * it can't drift into a second, averaging-based definition of "non-compliant".
 * Ranks the full set before `DASHBOARD_CHART_LIMIT` trims it, same discipline
 * as `buildSrpVsActual`, so a store with few total records but many violations
 * can't be cut before the sort has a chance to surface it.
 */
export function buildStoreViolations(records: PriceRecordWithStoreForAnalytics[]): StoreViolationPoint[] {
  const totalsByStore = new Map<string, { name: string; violations: number; total: number }>();

  for (const record of records) {
    if (!record.storeId) continue;

    const bucket = totalsByStore.get(record.storeId) ?? {
      name: record.store?.name ?? 'Unknown store',
      violations: 0,
      total: 0,
    };
    bucket.total += 1;
    if (record.status === 'OVERPRICE') {
      bucket.violations += 1;
    }
    totalsByStore.set(record.storeId, bucket);
  }

  return [...totalsByStore.entries()]
    .map(([storeId, bucket]) => ({
      storeId,
      storeName: bucket.name,
      violationCount: bucket.violations,
      totalRecords: bucket.total,
      violationRate: Math.round((bucket.violations / bucket.total) * 1000) / 10,
    }))
    .sort((a, b) => b.violationCount - a.violationCount);
}

export const dashboardService = {
  getAnalytics: async (
    authUser?: AuthUser,
    filters?: DashboardDateRange & { commodityId?: string },
  ): Promise<DashboardAnalytics> => {
    const records = await dashboardRepository.findRecentPriceRecords(authUser, filters);

    // The commodity filter narrows the trend line only. The two ranking charts
    // below exist to compare commodities against one another, so they read the
    // full in-window set — narrowing them would collapse each to a single bar.
    const trendRecords = filters?.commodityId
      ? records.filter((record) => record.commodityId === filters.commodityId)
      : records;

    const priceTrend = buildPriceTrend(trendRecords);
    const commodityComparison = buildCommodityComparison(records);

    const srps = await dashboardRepository.findLatestSrps(
      commodityComparison.map((point) => point.commodityId),
    );

    const srpByCommodity = new Map<string, number>();
    for (const srp of srps) {
      if (!srpByCommodity.has(srp.commodityId)) {
        srpByCommodity.set(srp.commodityId, srp.price.toNumber());
      }
    }

    // Rank across every commodity, then trim — slicing before the sort would
    // rank only an arbitrary subset.
    const srpVsActual = buildSrpVsActual(commodityComparison, srpByCommodity);

    return {
      priceTrend,
      commodityComparison: commodityComparison.slice(0, DASHBOARD_CHART_LIMIT),
      srpVsActual: srpVsActual.slice(0, DASHBOARD_CHART_LIMIT),
      commodityOptions: buildCommodityOptions(records),
    };
  },

  // Returns the full ranked list, not capped to DASHBOARD_CHART_LIMIT — this
  // feeds a dedicated table on its own screen, not a fixed-height dashboard
  // card, so it can show every store. The chart on that screen caps itself.
  // Defaults to the trailing 30-day window (dashboard.repository's
  // TREND_WINDOW_DAYS) when no range is given, same as before this had a filter.
  getStoreViolations: async (
    authUser?: AuthUser,
    range?: { startDate?: Date; endDate?: Date },
  ): Promise<StoreViolationPoint[]> => {
    const records = await dashboardRepository.findRecentPriceRecordsWithStore(authUser, range);
    return buildStoreViolations(records);
  },
};
