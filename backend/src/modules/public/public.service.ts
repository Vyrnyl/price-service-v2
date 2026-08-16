export type ComplianceStatus = 'Above SRP' | 'Below SRP' | 'Compliant' | 'Unknown';

interface RawPriceRecord {
  id: string;
  price: unknown;
  dateAndTime: Date;
  createdAt: Date;
  status: string;
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
  priceRecords: PublicPriceRecordDto[];
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

export function buildPublicCommodityDto(commodity: RawCommodity): PublicCommodityDto {
  const latestSrp = commodity.srps[0];
  const latestPriceRecord = commodity.prices[0];
  const srpPrice = toNumberOrNull(latestSrp?.price);

  const priceValues = commodity.prices
    .map((priceRecord) => toNumberOrNull(priceRecord.price))
    .filter((price): price is number => price != null);
  const currentPrice = priceValues.length > 0
    ? priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length
    : null;

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
    complianceStatus: resolveComplianceStatus(currentPrice, srpPrice),
    lastUpdatedAt: latestPriceRecord?.dateAndTime ?? latestPriceRecord?.createdAt ?? commodity.createdAt,
    storeName: latestPriceRecord?.store?.name ?? null,
    storeLocation: latestPriceRecord?.store?.location ?? null,
    priceRecords,
  };
}

export function buildPublicCommoditiesPayload(commodities: RawCommodity[]): PublicCommodityDto[] {
  return commodities.map(buildPublicCommodityDto);
}
