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

  findRecentPriceRecordsWithStore: (authUser?: AuthUser, range?: { startDate?: Date; endDate?: Date }) => {
    const scope = resolveDashboardScope(authUser);

    let since = range?.startDate;
    if (!since) {
      since = new Date();
      since.setDate(since.getDate() - TREND_WINDOW_DAYS);
    }

    const dateAndTime: { gte: Date; lte?: Date } = { gte: since };
    if (range?.endDate) {
      dateAndTime.lte = range.endDate;
    }

    return prisma.priceRecord.findMany({
      where: { ...scope, dateAndTime, storeId: { not: null } },
      select: {
        storeId: true,
        status: true,
        store: { select: { name: true } },
      },
    });
  },
};
