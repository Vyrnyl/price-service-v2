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
