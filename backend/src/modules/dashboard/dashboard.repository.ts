import { prisma } from '../../prisma';
import type { AuthUser } from '../../shared/types/express';
import { resolveDashboardScope } from './dashboard.scope';

const TREND_WINDOW_DAYS = 30;

export const dashboardRepository = {
  findRecentPriceRecords: (authUser?: AuthUser) => {
    const scope = resolveDashboardScope(authUser);
    const since = new Date();
    since.setDate(since.getDate() - TREND_WINDOW_DAYS);

    return prisma.priceRecord.findMany({
      where: { ...scope, dateAndTime: { gte: since } },
      select: {
        commodityId: true,
        price: true,
        dateAndTime: true,
        commodity: { select: { name: true } },
      },
      orderBy: { dateAndTime: 'asc' },
    });
  },

  findLatestSrps: (commodityIds: string[]) => {
    if (commodityIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.sRP.findMany({
      where: { commodityId: { in: commodityIds }, effectiveDate: { lte: new Date() } },
      orderBy: { effectiveDate: 'desc' },
      select: { commodityId: true, price: true },
    });
  },
};
