import { latestPerEffectiveDate } from '../../shared/utils/srp-revisions';

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
  category: { name: string; iconKey?: string | null };
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
  /** Icon chosen for the category; null = the list matches one from the name. */
  categoryIconKey: string | null;
  status: string;
  currentPrice: number | null;
  srpPrice: number | null;
  complianceStatus: ComplianceStatus;
  /** Date of the newest of the per-store prices behind currentPrice; null = no price recorded yet. */
  lastUpdatedAt: Date | null;
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
export function buildPerStorePrices(
  prices: Array<Pick<RawPriceRecord, 'price' | 'dateAndTime' | 'storeId' | 'store'>>,
): PublicStorePriceDto[] {
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

/** One row per commodity × store: that store's newest price, however old (see findLatestPricePerStore). */
export interface LatestStorePriceRow {
  commodityId: string;
  storeId: string | null;
  price: unknown;
  dateAndTime: Date;
  storeName: string | null;
  storeLocation: string | null;
}

/**
 * `latestStorePrices`, when given, decides current price, range, compliance
 * and lastUpdatedAt: each store's newest price of any age, so an item last
 * monitored months ago still shows its latest prices (dated) instead of
 * nothing. Without it, the newest price per store in `commodity.prices` is
 * used. `priceRecords` always comes from `commodity.prices` (the recent window).
 */
export function buildPublicCommodityDto(
  commodity: RawCommodity,
  latestStorePrices?: LatestStorePriceRow[],
): PublicCommodityDto {
  const latestSrp = commodity.srps[0];
  const srpPrice = toNumberOrNull(latestSrp?.price);

  const perStoreSource = latestStorePrices
    ? [...latestStorePrices]
        .sort((a, b) => b.dateAndTime.getTime() - a.dateAndTime.getTime())
        .map((row) => ({
          price: row.price,
          dateAndTime: row.dateAndTime,
          storeId: row.storeId,
          store: row.storeName != null ? { name: row.storeName, location: row.storeLocation ?? '' } : null,
        }))
    : commodity.prices;
  const perStorePrices = buildPerStorePrices(perStoreSource);
  const newestStorePrice = perStorePrices[0];
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
    category: commodity.category.name,
    categoryIconKey: commodity.category.iconKey ?? null,
    status: commodity.status,
    currentPrice,
    srpPrice,
    complianceStatus,
    lastUpdatedAt: newestStorePrice?.dateAndTime ?? null,
    storeName: newestStorePrice?.storeName ?? null,
    storeLocation: newestStorePrice?.storeLocation ?? null,
    priceRange,
    perStorePrices,
    priceRecords,
  };
}

export function buildPublicCommoditiesPayload(
  commodities: RawCommodity[],
  latestStorePrices?: LatestStorePriceRow[],
): PublicCommodityDto[] {
  if (!latestStorePrices) return commodities.map((commodity) => buildPublicCommodityDto(commodity));

  const byCommodity = new Map<string, LatestStorePriceRow[]>();
  for (const row of latestStorePrices) {
    const rows = byCommodity.get(row.commodityId);
    if (rows) rows.push(row);
    else byCommodity.set(row.commodityId, [row]);
  }
  return commodities.map((commodity) => buildPublicCommodityDto(commodity, byCommodity.get(commodity.id) ?? []));
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

interface RawSrpHistoryRow {
  id: string;
  price: unknown;
  effectiveDate: Date;
  createdAt: Date;
}

interface RawCommodityWithSrpHistory {
  id: string;
  name: string;
  category: { name: string };
  srps: RawSrpHistoryRow[];
}

export interface PublicSrpHistoryEntryDto {
  id: string;
  price: number;
  effectiveDate: Date;
}

export interface PublicSrpHistoryDto {
  commodityId: string;
  commodityName: string;
  category: string;
  /** Oldest first. */
  entries: PublicSrpHistoryEntryDto[];
}

/** Same-date rows collapse to the last one saved — see `latestPerEffectiveDate`. */
export function buildSrpHistoryDto(commodity: RawCommodityWithSrpHistory): PublicSrpHistoryDto {
  return {
    commodityId: commodity.id,
    commodityName: commodity.name,
    category: commodity.category.name,
    entries: latestPerEffectiveDate(commodity.srps).map((srp) => ({
      id: srp.id,
      price: Number(srp.price),
      effectiveDate: srp.effectiveDate,
    })),
  };
}

/** Most price records the Price Trends history endpoint returns for one commodity. */
export const PRICE_HISTORY_MAX_RECORDS = 5000;

interface RawPriceHistoryRecord {
  id: string;
  price: unknown;
  dateAndTime: Date;
  status: string;
  store: { name: string; location: string } | null;
}

interface RawCommodityWithPriceHistory {
  id: string;
  srps: RawSrpHistoryRow[];
  prices: RawPriceHistoryRecord[];
}

export interface PublicPriceHistoryDto {
  commodityId: string;
  /** Newest first, the same order as `PublicCommodityDto.priceRecords`. */
  records: PublicPriceRecordDto[];
  /** True when the commodity has more records than PRICE_HISTORY_MAX_RECORDS (the oldest are left out). */
  truncated: boolean;
}

/**
 * One commodity's full price history for the Price Trends chart. Unlike the
 * bulk payload — which labels every record with today's SRP — each record is
 * judged against the SRP that was in force on its own date, so a history that
 * spans an SRP change reads correctly.
 */
export function buildPriceHistoryDto(
  commodity: RawCommodityWithPriceHistory,
  maxRecords: number = PRICE_HISTORY_MAX_RECORDS,
): PublicPriceHistoryDto {
  const srpRevisions = latestPerEffectiveDate(commodity.srps); // oldest first

  const srpInForceOn = (date: Date): number | null => {
    let inForce: number | null = null;
    for (const revision of srpRevisions) {
      if (revision.effectiveDate.getTime() > date.getTime()) break;
      inForce = toNumberOrNull(revision.price);
    }
    return inForce;
  };

  const records = commodity.prices.map((record) => {
    const price = toNumberOrNull(record.price);
    const srpPrice = srpInForceOn(record.dateAndTime);
    return {
      id: record.id,
      price,
      dateAndTime: record.dateAndTime,
      status: record.status,
      srpPrice,
      storeName: record.store?.name ?? null,
      storeLocation: record.store?.location ?? null,
      complianceStatus: resolveComplianceStatus(price, srpPrice),
    };
  });

  return { commodityId: commodity.id, records, truncated: commodity.prices.length >= maxRecords };
}
