import type { PriceStatus } from '@prisma/client';

export interface SrpLookupEntry {
  commodityId: string;
  price: number;
  effectiveDate: Date;
}

export interface SummarySource {
  commodityId: string;
  storeId: string | null;
  price: number;
  status: PriceStatus;
}

/**
 * One flattened, display-ready row. Every type-specific aggregate below reads
 * from this shape rather than the ORM shape, so grouping/trend logic never
 * touches Prisma types and stays unit-testable without a DB.
 */
export interface ReportRow {
  date: string;
  time: string;
  dateAndTime: Date;
  storeId: string | null;
  store: string;
  location: string;
  commodityId: string;
  commodity: string;
  category: string;
  price: number;
  srp: number | null;
  variance: number | null;
  status: PriceStatus;
  officer: string;
}

export interface ReportSummary {
  totalRecords: number;
  compliantCount: number;
  overpriceCount: number;
  underpriceCount: number;
  complianceRate: number | null;
  averagePrice: number | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  commodityCount: number;
  storeCount: number;
}

/**
 * Finds the SRP in effect for a commodity at a given moment: the most recent
 * entry whose `effectiveDate` is on or before that moment. Returns `null` when
 * the commodity had no SRP set yet — the report renders those cells as "—"
 * rather than inventing a comparison.
 */
export function resolveSrpAt(
  srps: SrpLookupEntry[],
  commodityId: string,
  at: Date,
): number | null {
  let best: SrpLookupEntry | null = null;

  for (const srp of srps) {
    if (srp.commodityId !== commodityId) {
      continue;
    }

    if (srp.effectiveDate.getTime() > at.getTime()) {
      continue;
    }

    if (best === null || srp.effectiveDate.getTime() > best.effectiveDate.getTime()) {
      best = srp;
    }
  }

  return best === null ? null : best.price;
}

export function buildReportSummary(records: SummarySource[]): ReportSummary {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      compliantCount: 0,
      overpriceCount: 0,
      underpriceCount: 0,
      complianceRate: null,
      averagePrice: null,
      lowestPrice: null,
      highestPrice: null,
      commodityCount: 0,
      storeCount: 0,
    };
  }

  const commodities = new Set<string>();
  const stores = new Set<string>();
  let compliantCount = 0;
  let overpriceCount = 0;
  let underpriceCount = 0;
  let priceTotal = 0;
  let lowestPrice = Number.POSITIVE_INFINITY;
  let highestPrice = Number.NEGATIVE_INFINITY;

  for (const record of records) {
    commodities.add(record.commodityId);

    if (record.storeId) {
      stores.add(record.storeId);
    }

    if (record.status === 'COMPLIANT') {
      compliantCount += 1;
    } else if (record.status === 'OVERPRICE') {
      overpriceCount += 1;
    } else {
      underpriceCount += 1;
    }

    priceTotal += record.price;
    lowestPrice = Math.min(lowestPrice, record.price);
    highestPrice = Math.max(highestPrice, record.price);
  }

  return {
    totalRecords,
    compliantCount,
    overpriceCount,
    underpriceCount,
    complianceRate: (compliantCount / totalRecords) * 100,
    averagePrice: priceTotal / totalRecords,
    lowestPrice,
    highestPrice,
    commodityCount: commodities.size,
    storeCount: stores.size,
  };
}

/* ------------------------------------------------------------------ *
 * MONTHLY — grouped by commodity, with per-commodity subtotals
 * ------------------------------------------------------------------ */

export interface CommodityGroupSubtotal {
  count: number;
  averagePrice: number;
  compliantCount: number;
  overpriceCount: number;
  underpriceCount: number;
}

export interface CommodityGroup {
  commodityId: string;
  commodity: string;
  category: string;
  rows: ReportRow[];
  subtotal: CommodityGroupSubtotal;
}

/**
 * Groups rows by commodity, preserving each group's existing row order
 * (callers pass rows already sorted by date). Groups are sorted alphabetically
 * by commodity name so the printed report reads as a catalogue, not an
 * artifact of query order.
 */
export function groupRowsByCommodity(rows: ReportRow[]): CommodityGroup[] {
  const groups = new Map<string, CommodityGroup>();

  for (const row of rows) {
    let group = groups.get(row.commodityId);

    if (!group) {
      group = {
        commodityId: row.commodityId,
        commodity: row.commodity,
        category: row.category,
        rows: [],
        subtotal: {
          count: 0,
          averagePrice: 0,
          compliantCount: 0,
          overpriceCount: 0,
          underpriceCount: 0,
        },
      };
      groups.set(row.commodityId, group);
    }

    group.rows.push(row);
  }

  for (const group of groups.values()) {
    let priceTotal = 0;
    let compliantCount = 0;
    let overpriceCount = 0;
    let underpriceCount = 0;

    for (const row of group.rows) {
      priceTotal += row.price;

      if (row.status === 'COMPLIANT') compliantCount += 1;
      else if (row.status === 'OVERPRICE') overpriceCount += 1;
      else underpriceCount += 1;
    }

    group.subtotal = {
      count: group.rows.length,
      averagePrice: priceTotal / group.rows.length,
      compliantCount,
      overpriceCount,
      underpriceCount,
    };
  }

  return Array.from(groups.values()).sort((a, b) => a.commodity.localeCompare(b.commodity));
}

/* ------------------------------------------------------------------ *
 * SRP_COMPLIANCE — per-store compliance rate + violations only
 * ------------------------------------------------------------------ */

export interface StoreComplianceRow {
  storeId: string | null;
  store: string;
  totalRecords: number;
  compliantCount: number;
  overpriceCount: number;
  underpriceCount: number;
  complianceRate: number;
}

export interface ComplianceReport {
  storeCompliance: StoreComplianceRow[];
  violations: ReportRow[];
  compliantCount: number;
  underpriceCount: number;
}

/**
 * Violations first, worst offenders first — the point of this report type is
 * to surface non-compliance, not to re-list every record. Compliant and
 * below-SRP rows are counted, never itemized, so the document stays focused.
 */
export function buildComplianceReport(rows: ReportRow[]): ComplianceReport {
  const byStore = new Map<string, StoreComplianceRow>();
  let compliantCount = 0;
  let underpriceCount = 0;

  for (const row of rows) {
    const key = row.storeId ?? 'unknown';
    let storeRow = byStore.get(key);

    if (!storeRow) {
      storeRow = {
        storeId: row.storeId,
        store: row.store,
        totalRecords: 0,
        compliantCount: 0,
        overpriceCount: 0,
        underpriceCount: 0,
        complianceRate: 0,
      };
      byStore.set(key, storeRow);
    }

    storeRow.totalRecords += 1;
    if (row.status === 'COMPLIANT') storeRow.compliantCount += 1;
    else if (row.status === 'OVERPRICE') storeRow.overpriceCount += 1;
    else storeRow.underpriceCount += 1;

    if (row.status === 'COMPLIANT') compliantCount += 1;
    else if (row.status === 'UNDERPRICE') underpriceCount += 1;
  }

  const storeCompliance = Array.from(byStore.values())
    .map((store) => ({
      ...store,
      complianceRate: (store.compliantCount / store.totalRecords) * 100,
    }))
    .sort((a, b) => a.complianceRate - b.complianceRate);

  const violations = rows
    .filter((row) => row.status === 'OVERPRICE')
    .sort((a, b) => (b.variance ?? 0) - (a.variance ?? 0));

  return { storeCompliance, violations, compliantCount, underpriceCount };
}

/* ------------------------------------------------------------------ *
 * TREND — weekly average per commodity, movement vs. period start
 * ------------------------------------------------------------------ */

export interface TrendPoint {
  weekStart: Date;
  averagePrice: number;
  recordCount: number;
}

export interface CommodityTrend {
  commodityId: string;
  commodity: string;
  category: string;
  points: TrendPoint[];
  periodStartPrice: number | null;
  periodEndPrice: number | null;
  movementPercent: number | null;
}

/** Monday (UTC) of the calendar week containing `date`. */
function startOfWeek(date: Date): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = day.getUTCDay();
  const diffToMonday = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - diffToMonday);
  return day;
}

/**
 * Buckets rows into weekly averages per commodity and computes movement of
 * the last week's average against the first week's — a time series, not a
 * record dump. Rows must already carry a real `dateAndTime`; commodities with
 * only one week of data still get a valid (flat, 0%) trend rather than being
 * dropped.
 */
export function buildTrendReport(rows: ReportRow[]): CommodityTrend[] {
  const byCommodity = new Map<
    string,
    { commodity: string; category: string; weeks: Map<number, { total: number; count: number }> }
  >();

  for (const row of rows) {
    let entry = byCommodity.get(row.commodityId);

    if (!entry) {
      entry = { commodity: row.commodity, category: row.category, weeks: new Map() };
      byCommodity.set(row.commodityId, entry);
    }

    const weekKey = startOfWeek(row.dateAndTime).getTime();
    const week = entry.weeks.get(weekKey) ?? { total: 0, count: 0 };
    week.total += row.price;
    week.count += 1;
    entry.weeks.set(weekKey, week);
  }

  const trends: CommodityTrend[] = [];

  for (const [commodityId, entry] of byCommodity) {
    const points: TrendPoint[] = Array.from(entry.weeks.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekStartMs, { total, count }]) => ({
        weekStart: new Date(weekStartMs),
        averagePrice: total / count,
        recordCount: count,
      }));

    const periodStartPrice = points[0]?.averagePrice ?? null;
    const periodEndPrice = points[points.length - 1]?.averagePrice ?? null;
    const movementPercent =
      periodStartPrice == null || periodEndPrice == null || periodStartPrice === 0
        ? null
        : ((periodEndPrice - periodStartPrice) / periodStartPrice) * 100;

    trends.push({
      commodityId,
      commodity: entry.commodity,
      category: entry.category,
      points,
      periodStartPrice,
      periodEndPrice,
      movementPercent,
    });
  }

  return trends.sort((a, b) => a.commodity.localeCompare(b.commodity));
}
