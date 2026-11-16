/**
 * Shapes a commodity's price records into the Price Trends series. Pure
 * functions, so the chart, the change cards and the forecast report all read
 * the same numbers.
 */

const TIME_ZONE = "Asia/Manila";
const DAY_MS = 24 * 60 * 60 * 1000;

export type TrendRecord = {
  price: number | null;
  dateAndTime: string | null;
};

/** One date's point: the average of every store price recorded that day. */
export type AveragedTrendRecord = TrendRecord & {
  /** How many priced records the average is over (one per store visit). */
  storeCount: number;
  minPrice: number | null;
  maxPrice: number | null;
};

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD of the Manila calendar day the timestamp falls on. */
export function manilaDayKey(dateAndTime: string): string | null {
  const time = new Date(dateAndTime).getTime();
  return Number.isNaN(time) ? null : dayKeyFormatter.format(time);
}

/**
 * Groups records by Manila calendar day and averages each day's prices.
 * Input and output are newest first. A day whose records are all unpriced
 * keeps a null price so a gap stays visible. The point's timestamp is the
 * day's earliest record, so labels and windows read the same date as before.
 */
export function averageRecordsByDay(records: TrendRecord[]): AveragedTrendRecord[] {
  const days = new Map<string, { prices: number[]; count: number; earliest: string }>();
  const order: string[] = [];

  for (const record of records) {
    if (!record.dateAndTime) continue;
    const key = manilaDayKey(record.dateAndTime);
    if (!key) continue;
    let day = days.get(key);
    if (!day) {
      day = { prices: [], count: 0, earliest: record.dateAndTime };
      days.set(key, day);
      order.push(key);
    }
    day.count += 1;
    if (record.price != null && !Number.isNaN(record.price)) day.prices.push(record.price);
    if (new Date(record.dateAndTime).getTime() < new Date(day.earliest).getTime()) day.earliest = record.dateAndTime;
  }

  return order
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((key) => {
      const day = days.get(key)!;
      const priced = day.prices.length;
      return {
        dateAndTime: day.earliest,
        price: priced > 0 ? day.prices.reduce((sum, p) => sum + p, 0) / priced : null,
        storeCount: priced,
        minPrice: priced > 0 ? Math.min(...day.prices) : null,
        maxPrice: priced > 0 ? Math.max(...day.prices) : null,
      };
    });
}

/** Newest record timestamp in ms, or null when there are no dated records. */
export function latestRecordTime(records: TrendRecord[]): number | null {
  let latest: number | null = null;
  for (const record of records) {
    if (!record.dateAndTime) continue;
    const time = new Date(record.dateAndTime).getTime();
    if (!Number.isNaN(time) && (latest == null || time > latest)) latest = time;
  }
  return latest;
}

/** Records dated within `days` before `anchorTime` (inclusive), any order preserved. */
export function filterWithinDaysBefore<T extends TrendRecord>(records: T[], days: number, anchorTime: number): T[] {
  const cutoff = anchorTime - days * DAY_MS;
  return records.filter((record) => {
    if (!record.dateAndTime) return false;
    const time = new Date(record.dateAndTime).getTime();
    return !Number.isNaN(time) && time >= cutoff && time <= anchorTime;
  });
}

function mean(values: number[]): number | null {
  return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

export type SeriesChanges = {
  /** Latest daily average vs the one before it. */
  latest: { from: AveragedTrendRecord; to: AveragedTrendRecord } | null;
  /** Mean of the 7 days up to the anchor vs the mean of the 7 days before that. */
  week: { previous: number; current: number } | null;
  /** Latest daily average vs the earliest one within 30 days before the anchor. */
  month: { from: AveragedTrendRecord; to: AveragedTrendRecord } | null;
};

/** The change cards' figures, from a newest-first averaged series. */
export function computeSeriesChanges(series: AveragedTrendRecord[], anchorTime: number): SeriesChanges {
  const priced = series.filter((point) => point.price != null);
  const latest = priced.length > 1 ? { from: priced[1]!, to: priced[0]! } : null;

  const prices = (from: number, to: number) =>
    priced
      .filter((point) => {
        const time = new Date(point.dateAndTime!).getTime();
        return time > from && time <= to;
      })
      .map((point) => point.price!);
  const current = mean(prices(anchorTime - 7 * DAY_MS, anchorTime));
  const previous = mean(prices(anchorTime - 14 * DAY_MS, anchorTime - 7 * DAY_MS));
  const week = current != null && previous != null ? { previous, current } : null;

  const lastThirty = filterWithinDaysBefore(priced, 30, anchorTime);
  const month = lastThirty.length > 1 ? { from: lastThirty[lastThirty.length - 1]!, to: lastThirty[0]! } : null;

  return { latest, week, month };
}
