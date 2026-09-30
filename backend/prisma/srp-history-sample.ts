/**
 * Earlier SRPs for the five commodities that sort first by name, so the SRP
 * history pop-up has a real series to draw on the first screen a visitor sees
 * (lists are ordered `name: asc` everywhere — the same reasoning as
 * `DTI_PRICE_HISTORY_SAMPLE` in `seed.ts`).
 *
 * Shared by `prisma/seed.ts` (fresh databases) and
 * `scripts/seed-srp-history.ts` (the live database), so both produce the same
 * history.
 *
 * Every generated SRP is dated strictly before the date passed as `before`.
 * Callers pass a date no later than the commodity's earliest existing SRP and
 * earliest price record: price-record status and the report generator both
 * resolve "the SRP in effect on the record's date", so an SRP dated inside the
 * recorded period would silently change how existing records are judged.
 */

export const SRP_HISTORY_SAMPLE_NAMES = [
  "5-STAR Esperma (White) #14 4pcs./pack",
  "5-STAR Esperma (White) #22 2pcs./pack",
  "5-STAR Esperma (White) #3 20pcs./pack",
  "5-STAR Esperma (White) #6 25pcs./pack",
  "5-STAR Esperma (White) #8 5pcs./pack",
];

/** Earlier SRPs added per commodity. */
export const SRP_HISTORY_STEPS = 4;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SrpHistoryStep = { price: number; effectiveDate: Date };

function hashName(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** Deterministic 0–1 value, so re-running produces the same history. */
function unit(seed: number, step: number) {
  const x = Math.sin(seed * 0.0001 + step * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function roundToQuarter(value: number) {
  return Math.round(value * 4) / 4;
}

function utcMidnight(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Walks back from the commodity's earliest known SRP. Most earlier SRPs are
 * lower (SRPs mostly rise), and one step per commodity is a decrease so the
 * history is not a uniform staircase. Moves stay within 1–6% per change, the
 * scale of a real SRP revision. Returned oldest first.
 */
export function buildEarlierSrps(name: string, anchorPrice: number, before: Date): SrpHistoryStep[] {
  const seed = hashName(name);
  const decreaseStep = seed % SRP_HISTORY_STEPS;
  const steps: SrpHistoryStep[] = [];

  let laterPrice = anchorPrice;
  // The nearest earlier SRP sits 45–75 days before the anchor; the rest are
  // 100–170 days apart, so the full history spans roughly 1–1.7 years.
  let cursor = before.getTime() - (45 + Math.floor(unit(seed, 0) * 30)) * DAY_MS;

  for (let step = 0; step < SRP_HISTORY_STEPS; step += 1) {
    const isDecrease = step === decreaseStep;
    const pct = isDecrease ? 0.01 + unit(seed, step + 11) * 0.01 : 0.02 + unit(seed, step + 11) * 0.04;
    // Walking backwards: a later increase means the earlier price was lower.
    let price = roundToQuarter(laterPrice * (isDecrease ? 1 + pct : 1 - pct));
    if (price === laterPrice) {
      price = isDecrease ? price + 0.25 : price - 0.25;
    }
    price = Math.max(0.25, price);

    steps.push({ price, effectiveDate: utcMidnight(cursor) });
    laterPrice = price;
    cursor -= (100 + Math.floor(unit(seed, step + 21) * 70)) * DAY_MS;
  }

  return steps.reverse();
}
