import { dashboardRepository } from './dashboard.repository';
import type { AuthUser } from '../../shared/types/express';
import type { CommodityComparisonPoint, DashboardAnalytics, PriceTrendPoint } from './dashboard.types';

export type PriceRecordForAnalytics = Awaited<
  ReturnType<typeof dashboardRepository.findRecentPriceRecords>
>[number];

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

export const dashboardService = {
  getAnalytics: async (authUser?: AuthUser): Promise<DashboardAnalytics> => {
    const records = await dashboardRepository.findRecentPriceRecords(authUser);

    const priceTrend = buildPriceTrend(records);
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

    const srpVsActual = commodityComparison
      .filter((point) => srpByCommodity.has(point.commodityId))
      .map((point) => ({
        commodityId: point.commodityId,
        commodityName: point.commodityName,
        srp: srpByCommodity.get(point.commodityId) as number,
        actualAverage: point.averagePrice,
      }));

    return { priceTrend, commodityComparison, srpVsActual };
  },
};
