// Helpers for the Price Records date range (PRICE_RECORD_DATE_RANGE_ENABLED).
// Values are the "YYYY-MM-DD" strings an <input type="date"> produces, read as
// local calendar dates — never through new Date("YYYY-MM-DD"), which is UTC.

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Today as "YYYY-MM-DD" in local time — the default for both ends of the range. */
export function todayInputDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Range ends are calendar dates stored the way SRP effective dates are: the
// date at 00:00 UTC (what the API makes of "YYYY-MM-DD"). So a range starting
// on the day an SRP takes effect is judged against that SRP — local midnight
// in Manila would be 8 hours before it — and the stored date reads back the
// same in any time zone.

/** The range start as stored in `dateAndTime`: that date at 00:00 UTC. */
export function rangeStartIso(from: string): string | null {
  return parseLocalDate(from) ? `${from}T00:00:00.000Z` : null;
}

/** The range end as stored in `periodEnd`: that date at 00:00 UTC. */
export function rangeEndIso(to: string): string | null {
  return parseLocalDate(to) ? `${to}T00:00:00.000Z` : null;
}

/** A stored range end (or start) back to its "YYYY-MM-DD" calendar date. */
export function isoToRangeDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** A single date & time record's "YYYY-MM-DD" local date, as the list shows it. */
export function isoToInputDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** True when both ends are valid dates and `to` is not before `from`. */
export function isValidDateRange(from: string, to: string): boolean {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  return Boolean(start && end && start.getTime() <= end.getTime());
}

/**
 * "Jan 5 – Feb 20, 2026"; the year is repeated only when the ends differ
 * ("Dec 20, 2025 – Jan 5, 2026"), and a one-day range is a single date.
 */
export function formatDateRange(from: string, to: string): string {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (!start || !end) return "";

  const withYear: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  if (start.getTime() === end.getTime()) return start.toLocaleDateString("en-US", withYear);

  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString(
    "en-US",
    sameYear ? { month: "short", day: "numeric" } : withYear,
  );
  return `${startLabel} – ${end.toLocaleDateString("en-US", withYear)}`;
}

/** Days covered, counting both ends (Jan 1 – Jan 1 is 1 day). */
export function countRangeDays(from: string, to: string): number {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (!start || !end) return 0;
  // Date.UTC sidesteps daylight-saving shifts between the two dates.
  const toUtc = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((toUtc(end) - toUtc(start)) / 86_400_000) + 1;
}

/**
 * A stored record's range as the list shows it ("Jan 5 – Feb 20, 2026",
 * 47 days), or nothing when the record has no `periodEnd`. Shared by every
 * mapper that feeds PriceRecordsTable.
 */
export function toRecordDateRange(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): { periodEnd: string; dateRange: { label: string; days: number } } | Record<string, never> {
  if (!startIso || !endIso) return {};
  const from = isoToRangeDate(startIso);
  const to = isoToRangeDate(endIso);
  return {
    periodEnd: endIso,
    dateRange: { label: formatDateRange(from, to), days: countRangeDays(from, to) },
  };
}
