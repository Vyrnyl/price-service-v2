/**
 * Backfills daily price-trend history for the "ABSOLUTE PURE WATER" commodity.
 *
 * The commodity had only 4 price records, which is too short a series for the
 * trend chart or ARIMA forecasting to say anything. This adds 20 consecutive
 * daily readings immediately *before* the existing ones so the two stretches
 * form one continuous series.
 *
 * Status is derived with the same rule as price-record.repository.ts: the most
 * recent SRP effective on or before the reading's date, defaulting to
 * COMPLIANT when the commodity had no SRP yet.
 *
 * Idempotent — a day that already has a record for this commodity is skipped.
 * Run with: npx tsx scripts/seed-absolute-pure-water-trend.ts
 */
import { prisma } from '../src/prisma';

const COMMODITY_NAME = 'ABSOLUTE PURE WATER';
const OFFICER_EMAIL = 'officer@presyoserbisyo.gov.ph';
const DAYS_TO_SEED = 20;

/** Day before the earliest existing record (2026-08-25), so the series joins up. */
const LAST_SEEDED_DAY = new Date('2026-08-24T00:00:00.000Z');

/** Field visits happen in the afternoon; mirrors the existing rows' local times. */
const VISIT_HOUR_UTC = 17;

type PriceStatus = 'COMPLIANT' | 'OVERPRICE' | 'UNDERPRICE';

function calculateStatus(price: number, srpPrice: number | null): PriceStatus {
  if (srpPrice === null) return 'COMPLIANT';
  if (price > srpPrice) return 'OVERPRICE';
  if (price < srpPrice) return 'UNDERPRICE';
  return 'COMPLIANT';
}

/**
 * A gentle upward drift from ~13 to ~15 pesos with day-to-day jitter, landing
 * where the existing records pick up (16, 15, 14, 15). Bottled water is priced
 * in whole and half pesos, so values are rounded to the nearest 0.25.
 */
function priceForDay(index: number): number {
  const base = 13 + (index / (DAYS_TO_SEED - 1)) * 2;
  const jitter = (Math.random() - 0.5) * 1.2;
  return Math.max(1, Math.round((base + jitter) * 4) / 4);
}

async function main() {
  const commodity = await prisma.commodity.findFirst({ where: { name: COMMODITY_NAME } });
  if (!commodity) throw new Error(`Commodity "${COMMODITY_NAME}" not found.`);

  const officer = await prisma.user.findUnique({ where: { email: OFFICER_EMAIL } });
  if (!officer) throw new Error(`User "${OFFICER_EMAIL}" not found.`);

  const stores = await prisma.store.findMany({ orderBy: { name: 'asc' } });
  if (stores.length === 0) throw new Error('No stores exist to attach price records to.');

  const srps = await prisma.sRP.findMany({
    where: { commodityId: commodity.id },
    orderBy: { effectiveDate: 'desc' },
  });

  const effectiveSrp = (on: Date): number | null => {
    const match = srps.find((s) => s.effectiveDate <= on);
    return match ? parseFloat(match.price.toString()) : null;
  };

  let created = 0;
  let skipped = 0;

  for (let offset = DAYS_TO_SEED - 1; offset >= 0; offset -= 1) {
    const index = DAYS_TO_SEED - 1 - offset;
    const dateAndTime = new Date(LAST_SEEDED_DAY);
    dateAndTime.setUTCDate(dateAndTime.getUTCDate() - offset);
    dateAndTime.setUTCHours(VISIT_HOUR_UTC, 30 + (index % 20), 0, 0);

    const dayStart = new Date(dateAndTime);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const existing = await prisma.priceRecord.findFirst({
      where: {
        commodityId: commodity.id,
        dateAndTime: { gte: dayStart, lt: dayEnd },
      },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const price = priceForDay(index);
    const store = stores[index % stores.length];

    await prisma.priceRecord.create({
      data: {
        commodityId: commodity.id,
        storeId: store.id,
        userId: officer.id,
        price,
        dateAndTime,
        status: calculateStatus(price, effectiveSrp(dateAndTime)),
      },
    });
    created += 1;
  }

  const total = await prisma.priceRecord.count({ where: { commodityId: commodity.id } });
  console.log(`Created ${created} price records (${skipped} days already had one).`);
  console.log(`"${commodity.name}" now has ${total} price records.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
