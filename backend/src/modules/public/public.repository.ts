import { prisma } from '../../prisma';

export const publicRepository = {
  findCommoditiesForPublic: (windowStart: Date) => prisma.commodity.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
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
