import { prisma } from '../../prisma';

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

  countMonitoredStores: () => prisma.store.count(),

  countPriceUpdatesSince: (cutoff: Date) => prisma.priceRecord.count({
    where: { dateAndTime: { gte: cutoff } },
  }),
};
