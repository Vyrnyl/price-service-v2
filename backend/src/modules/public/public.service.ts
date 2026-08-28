export type ComplianceStatus = 'Above SRP' | 'Below SRP' | 'Compliant' | 'Unknown';

export const PUBLIC_HISTORY_WINDOW_DAYS = 60;

interface RawPriceRecord {
  id: string;
  price: unknown;
  dateAndTime: Date;
  createdAt: Date;
  status: string;
  storeId: string | null;
  store: { name: string; location: string } | null;
}

interface RawSrp {
  price: unknown;
  effectiveDate: Date;
  createdAt: Date;
}

interface RawCommodity {
  id: string;
  name: string;
  category: string;
  status: string;
  createdAt: Date;
  srps: RawSrp[];
  prices: RawPriceRecord[];
}

export interface PublicPriceRecordDto {
  id: string;
  price: number | null;
  dateAndTime: Date;
  status: string;
  srpPrice: number | null;
  storeName: string | null;
  storeLocation: string | null;
  complianceStatus: ComplianceStatus;
}

export interface PublicStorePriceDto {
  storeId: string;
  storeName: string | null;
  storeLocation: string | null;
  price: number;
  dateAndTime: Date;
}

export interface PublicPriceRangeDto {
  min: number;
  max: number;
  minStoreName: string | null;
  maxStoreName: string | null;
}

export interface PublicCommodityDto {
  id: string;
  name: string;
  category: string;
  status: string;
  currentPrice: number | null;
  srpPrice: number | null;
  complianceStatus: ComplianceStatus;
  lastUpdatedAt: Date;
  storeName: string | null;
  storeLocation: string | null;
  priceRange: PublicPriceRangeDto | null;
  perStorePrices: PublicStorePriceDto[];
  priceRecords: PublicPriceRecordDto[];
}

export interface PublicStatsDto {
  monitoredStoreCount: number;
  updatesToday: number;
}

function toNumberOrNull(value: unknown): number | null {
  return value != null ? Number(value) : null;
}

export function resolveComplianceStatus(price: number | null, srpPrice: number | null): ComplianceStatus {
  if (price == null || srpPrice == null) {
    return 'Unknown';
  }

  if (price > srpPrice) {
    return 'Above SRP';
  }

  if (price < srpPrice) {
    return 'Below SRP';
  }

  return 'Compliant';
}

/**
 * A commodity is non-compliant if *any* monitored store prices it above SRP —
 * averaging across stores would let an overpricing store hide behind a cheaper one (D-8).
 */
export function resolveComplianceStatusFromRange(
  storePrices: { price: number }[],
  srpPrice: number | null,
): ComplianceStatus {
  if (srpPrice == null || storePrices.length === 0) {
    return 'Unknown';
  }

  if (storePrices.some((entry) => entry.price > srpPrice)) {
    return 'Above SRP';
  }

  if (storePrices.some((entry) => entry.price < srpPrice)) {
    return 'Below SRP';
  }

  return 'Compliant';
}

/**
 * `prices` is assumed pre-sorted newest-first. Keeps only the latest record per store so a
 * store that reported twice in the window doesn't count twice toward the average or the range.
 * Records with no attributed store each count as their own entry rather than being merged,
 * since two null-store records can't be assumed to be the same store.
 */
export function buildPerStorePrices(prices: RawPriceRecord[]): PublicStorePriceDto[] {
  const seenStoreIds = new Set<string>();
  const result: PublicStorePriceDto[] = [];
  let unknownStoreIndex = 0;

  for (const record of prices) {
    const price = toNumberOrNull(record.price);
    if (price == null) {
      continue;
    }

    const key = record.storeId ?? `unknown-${unknownStoreIndex++}`;
    if (record.storeId != null && seenStoreIds.has(key)) {
      continue;
    }
    if (record.storeId != null) {
      seenStoreIds.add(key);
    }

    result.push({
      storeId: key,
      storeName: record.store?.name ?? null,
      storeLocation: record.store?.location ?? null,
      price,
      dateAndTime: record.dateAndTime,
    });
  }

  return result;
}

export function computePriceRange(storePrices: PublicStorePriceDto[]): PublicPriceRangeDto | null {
  if (storePrices.length === 0) {
    return null;
  }

  let min = storePrices[0]!;
  let max = storePrices[0]!;

  for (const entry of storePrices) {
    if (entry.price < min.price) min = entry;
    if (entry.price > max.price) max = entry;
  }

  return {
    min: min.price,
    max: max.price,
    minStoreName: min.storeName,
    maxStoreName: max.storeName,
  };
}

export function buildPublicCommodityDto(commodity: RawCommodity): PublicCommodityDto {
  const latestSrp = commodity.srps[0];
  const latestPriceRecord = commodity.prices[0];
  const srpPrice = toNumberOrNull(latestSrp?.price);

  const perStorePrices = buildPerStorePrices(commodity.prices);
  const priceRange = computePriceRange(perStorePrices);
  const currentPrice = perStorePrices.length > 0
    ? perStorePrices.reduce((sum, entry) => sum + entry.price, 0) / perStorePrices.length
    : null;
  const complianceStatus = resolveComplianceStatusFromRange(perStorePrices, srpPrice);

  const priceRecords: PublicPriceRecordDto[] = commodity.prices.map((priceRecord) => {
    const recordPrice = toNumberOrNull(priceRecord.price);

    return {
      id: priceRecord.id,
      price: recordPrice,
      dateAndTime: priceRecord.dateAndTime,
      status: priceRecord.status,
      srpPrice,
      storeName: priceRecord.store?.name ?? null,
      storeLocation: priceRecord.store?.location ?? null,
      complianceStatus: resolveComplianceStatus(recordPrice, srpPrice),
    };
  });

  return {
    id: commodity.id,
    name: commodity.name,
    category: commodity.category,
    status: commodity.status,
    currentPrice,
    srpPrice,
    complianceStatus,
    lastUpdatedAt: latestPriceRecord?.dateAndTime ?? commodity.createdAt,
    storeName: latestPriceRecord?.store?.name ?? null,
    storeLocation: latestPriceRecord?.store?.location ?? null,
    priceRange,
    perStorePrices,
    priceRecords,
  };
}

export function buildPublicCommoditiesPayload(commodities: RawCommodity[]): PublicCommodityDto[] {
  return commodities.map(buildPublicCommodityDto);
}

export function resolveHistoryWindowStart(now: Date = new Date()): Date {
  return new Date(now.getTime() - PUBLIC_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function resolveUpdatesCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000);
}

export function buildPublicStatsDto(monitoredStoreCount: number, updatesToday: number): PublicStatsDto {
  return { monitoredStoreCount, updatesToday };
}
