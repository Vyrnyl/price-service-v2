import { prisma } from '../../prisma';
import type { LatestStorePriceRow } from './public.service';

export const publicRepository = {
  findCommoditiesForPublic: (windowStart: Date) => prisma.commodity.findMany({
    // Alphabetical, matching the Commodities page (`commodity.repository`'s
    // list query). This was `createdAt: 'desc'`, which made the Price Trends
    // commodity picker list the same reference data in a different, unfindable
    // order. No consumer of this payload relies on recency — the ones that care
    // sort explicitly by `lastUpdatedAt` themselves.
    orderBy: { name: 'asc' },
    include: {
      category: true,
      srps: {
        orderBy: [
          { effectiveDate: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 1,
      },
      prices: {
        where: { dateAndTime: { gte: windowStart } },
        orderBy: [
          { dateAndTime: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          store: true,
        },
      },
    },
  }),

  // Every SRP row, not just the latest — editing an SRP inserts a new dated row,
  // so the table already is the history.
  findCommodityWithSrpHistory: (id: string) => prisma.commodity.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
      srps: {
        orderBy: [
          { effectiveDate: 'asc' },
          { createdAt: 'asc' },
        ],
        select: { id: true, price: true, effectiveDate: true, effectiveEndDate: true, createdAt: true },
      },
    },
  }),

  // One commodity's full price history for the Price Trends chart. The bulk
  // `findCommoditiesForPublic` payload keeps its recent window (it decides
  // current price and compliance); the chart's 3M/6M/1Y/Custom ranges need
  // more than that. Capped so a commodity monitored for years cannot return an
  // unbounded payload.
  findCommodityPriceHistory: (id: string, take: number) => prisma.commodity.findUnique({
    where: { id },
    select: {
      id: true,
      srps: {
        orderBy: [
          { effectiveDate: 'asc' },
          { createdAt: 'asc' },
        ],
        select: { id: true, price: true, effectiveDate: true, createdAt: true },
      },
      prices: {
        orderBy: [
          { dateAndTime: 'desc' },
          { createdAt: 'desc' },
        ],
        take,
        select: {
          id: true,
          price: true,
          dateAndTime: true,
          status: true,
          store: { select: { name: true, location: true } },
        },
      },
    },
  }),

  // Each store's newest price for every commodity, however old — what "Current
  // price", the price range and compliance are built from. One row per
  // commodity × store (DISTINCT ON keeps the first row of each group under the
  // ORDER BY), so this stays ~commodities × stores rows however long the
  // history grows. Ties on dateAndTime go to the record saved last.
  findLatestPricePerStore: () => prisma.$queryRaw<LatestStorePriceRow[]>`
    SELECT DISTINCT ON (pr."commodityId", pr."storeId")
      pr."commodityId", pr."storeId", pr."price", pr."dateAndTime",
      s."name" AS "storeName", s."location" AS "storeLocation"
    FROM "PriceRecord" pr
    LEFT JOIN "Store" s ON s."id" = pr."storeId"
    ORDER BY pr."commodityId", pr."storeId", pr."dateAndTime" DESC, pr."createdAt" DESC
  `,

  countMonitoredStores: () => prisma.store.count(),

  countPriceUpdatesSince: (cutoff: Date) => prisma.priceRecord.count({
    where: { dateAndTime: { gte: cutoff } },
  }),
};
