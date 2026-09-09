/**
 * Builds the plain-language summary of an observed price series shown in the
 * Detailed forecast report — e.g. "Prices declined from ₱200.00 to ₱135.00, a
 * drop of 32.5%."
 *
 * Kept as a pure function over `{ price, date }` points so the wording is
 * derived from the same series the chart draws, rather than being written by
 * hand and drifting from what the reader can see above it.
 */

export type TrendNarrativePoint = {
  price: number | null;
  date: string | null;
};

export type TrendNarrative = {
  /** One sentence naming the direction and the period it covers. */
  direction: string;
  /** One sentence giving the endpoints and the percentage change, when derivable. */
  movement: string;
};

/**
 * Below this, a move reads as flat rather than as a real trend — recorded prices
 * wobble by a few centavos between visits, and calling that a "decline" would
 * overstate what the data shows.
 */
const FLAT_THRESHOLD_PERCENT = 0.5;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Describes the span the series covers. Same month start and end reads as a
 * single month ("in August 2026") rather than the nonsensical "from August 2026
 * to August 2026".
 */
function describePeriod(points: TrendNarrativePoint[]): string | null {
  const dates = points
    .map((point) => parseDate(point.date))
    .filter((date): date is Date => date != null);

  if (dates.length === 0) return null;

  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  const firstLabel = formatMonthYear(first);
  const lastLabel = formatMonthYear(last);

  return firstLabel === lastLabel ? `in ${firstLabel}` : `from ${firstLabel} to ${lastLabel}`;
}

export function buildTrendNarrative(points: TrendNarrativePoint[]): TrendNarrative | null {
  const priced = points.filter(
    (point): point is { price: number; date: string | null } =>
      point.price != null && !Number.isNaN(point.price),
  );

  if (priced.length === 0) {
    return null;
  }

  const period = describePeriod(priced);

  // A single observation has no movement to describe, but saying so is still
  // more useful than rendering nothing where a summary is expected.
  if (priced.length === 1) {
    return {
      direction: period
        ? `Only one price record is available ${period}.`
        : "Only one price record is available for this range.",
      movement: `It was recorded at ${formatCurrency(priced[0]!.price)}. At least two records are needed to describe a trend.`,
    };
  }

  const startPrice = priced[0]!.price;
  const endPrice = priced[priced.length - 1]!.price;
  const change = endPrice - startPrice;

  // Guard against a zero starting price: the percentage is undefined there, so
  // report the movement in pesos instead of dividing by zero.
  const percentChange = startPrice !== 0 ? (change / startPrice) * 100 : null;
  const magnitude = Math.abs(percentChange ?? 0);
  const isFlat = percentChange != null && magnitude < FLAT_THRESHOLD_PERCENT;

  const periodSuffix = period ? ` ${period}` : "";

  if (isFlat || change === 0) {
    return {
      direction: `The visualization shows a broadly stable price${periodSuffix}.`,
      movement: `Prices held near ${formatCurrency(endPrice)}, moving less than ${FLAT_THRESHOLD_PERCENT}% across the period.`,
    };
  }

  const rising = change > 0;
  // "an upward" / "a downward" — the article has to follow the word.
  const directionPhrase = rising ? "an upward" : "a downward";
  const verb = rising ? "rose" : "declined";
  const changeWord = rising ? "rise" : "drop";

  const movement = percentChange != null
    ? `Prices ${verb} from ${formatCurrency(startPrice)} to ${formatCurrency(endPrice)}, a ${changeWord} of ${magnitude.toFixed(1)}%.`
    : `Prices ${verb} from ${formatCurrency(startPrice)} to ${formatCurrency(endPrice)}, a ${changeWord} of ${formatCurrency(Math.abs(change))}.`;

  return {
    direction: `The visualization shows ${directionPhrase} price trend${periodSuffix}.`,
    movement,
  };
}
