import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

/**
 * A date-only `endDate` ("2026-09-02") coerces to midnight UTC, which excludes
 * every record logged during that same day — the filter would silently drop the
 * whole final day of the range. Widen a bare date to the last instant of that
 * day; an explicit timestamp is left alone, since the caller already said what
 * it meant.
 *
 * The `Z` matters: `dateAndTime` is stored in UTC and the date-only string the
 * client sends is a UTC calendar day, so the boundary has to be UTC too. Without
 * it Node parses the bare timestamp in the server's local zone, which on a UTC+8
 * host cuts the day short at 15:59Z and drops most of its records.
 */
const endOfDayIfDateOnly = (value: unknown) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return `${value}T23:59:59.999Z`;
};

/**
 * Shared by every dashboard range filter so they cannot drift apart — the
 * end-of-day widening above was originally fixed on the store-violations filter
 * alone, and duplicating the shape rather than reusing it is exactly how the
 * report generator and that filter ended up disagreeing in the first place.
 */
const dateRangeShape = {
  startDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  endDate: z.preprocess(
    (value) => endOfDayIfDateOnly(emptyToUndefined(value)),
    z.coerce.date().optional(),
  ),
};

export const storeViolationsQuerySchema = z.object(dateRangeShape);

export type StoreViolationsQuery = z.infer<typeof storeViolationsQuerySchema>;

/**
 * `commodityId` narrows the price-trend line only. The two ranking charts
 * (Commodity Comparison, SRP vs. Actual) exist to compare commodities against
 * each other, so narrowing them to one commodity would collapse each to a
 * single bar — they honour the date range and ignore this.
 */
export const dashboardAnalyticsQuerySchema = z.object({
  ...dateRangeShape,
  commodityId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
});

export type DashboardAnalyticsQuery = z.infer<typeof dashboardAnalyticsQuerySchema>;
