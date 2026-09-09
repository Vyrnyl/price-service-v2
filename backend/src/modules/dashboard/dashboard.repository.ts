import { prisma } from '../../prisma';
import type { AuthUser } from '../../shared/types/express';
import { resolveDashboardScope } from './dashboard.scope';

const TREND_WINDOW_DAYS = 30;

export type DashboardDateRange = { startDate?: Date; endDate?: Date };

/**
 * Every dashboard query defaults to the same trailing window when the caller
 * gives no bound, so an unfiltered dashboard reads exactly as it did before
 * these filters existed.
 */
function resolveWindow(range?: DashboardDateRange) {
  let since = range?.startDate;
  if (!since) {
    since = new Date();
    since.setDate(since.getDate() - TREND_WINDOW_DAYS);
  }

  const dateAndTime: { gte: Date; lte?: Date } = { gte: since };
  if (range?.endDate) {
    dateAndTime.lte = range.endDate;
  }

  return dateAndTime;
}

export const dashboardRepository = {
  /**
   * Returns every in-window record for the caller's scope, deliberately without
   * a commodity filter — the two ranking charts are built from this same set and
   * must see all commodities to rank them. The price-trend chart narrows this
   * result in the service instead, so one query still feeds all three charts.
   */
  findRecentPriceRecords: (authUser?: AuthUser, range?: DashboardDateRange) => {
    const scope = resolveDashboardScope(authUser);

    return prisma.priceRecord.findMany({
      where: { ...scope, dateAndTime: resolveWindow(range) },
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

  findRecentPriceRecordsWithStore: (authUser?: AuthUser, range?: DashboardDateRange) => {
    const scope = resolveDashboardScope(authUser);

    return prisma.priceRecord.findMany({
      where: { ...scope, dateAndTime: resolveWindow(range), storeId: { not: null } },
      select: {
        storeId: true,
        status: true,
        store: { select: { name: true } },
      },
    });
  },
};
