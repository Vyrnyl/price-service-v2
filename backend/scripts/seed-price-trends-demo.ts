/**
 * Seeds ~90 days of demo price records for the first six commodities
 * (alphabetically) so the Price Trends chart, forecast, and narrative have a
 * real series to render.
 *
 * THIS WRITES TO THE LIVE DATABASE. There is no separate dev DB in this
 * project, so these rows appear on the public Price Trends and Commodity List
 * pages and feed the compliance figures.
 *
 * Every created row id is written to `scripts/.seeded-price-trends.json`, and
 * `scripts/unseed-price-trends-demo.ts` deletes exactly those ids and nothing
 * else. Run the unseed script to remove this data completely.
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/seed-price-trends-demo.ts
 *   npx tsx --import ./node_modules/dotenv/config scripts/unseed-price-trends-demo.ts
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export const SEEDED_IDS_PATH = join(__dirname, '.seeded-price-trends.json');

const DAYS = 90;
/** Officers do not visit every store every day; this is roughly every other day. */
const RECORD_EVERY_N_DAYS = 2;

const TARGET_COMMODITIES = [
  '5-STAR Esperma (White) 25pcs/pack',
  '5-STAR Esperma (White) 25pcs/pack (2)',
  '5-STAR Esperma (White)#14 4pcs/pack',
  '5-STAR Esperma (White)#22 2pcs/pack',
  '5-STAR Esperma (White)#8 5pcs/pack',
  '555 BONUS Pack Sardines (green) 155g',
];

/**
 * A distinct believable shape per commodity, expressed as a multiplier of the
 * item's own SRP over normalized time `t` (0 = 90 days ago, 1 = today). Mixed
 * directions on purpose: a chart where everything rises in parallel looks
 * generated, and a flat series is the exact problem this seed exists to fix.
 */
const SHAPES: Array<(t: number) => number> = [
  (t) => 0.94 + 0.22 * t, //  steady rise, crossing SRP partway
  (t) => 1.18 - 0.26 * t, //  steady decline from above SRP to below
  (t) => 1.02 + 0.16 * Math.sin(t * Math.PI * 1.5), // wave
  (t) => 1.12 - 0.30 * t + 0.26 * t * t, // dip then recover
  (t) => 0.97 + 0.05 * Math.sin(t * Math.PI * 3), // mostly flat, small ripple
  (t) => 0.90 + 0.30 * t - 0.12 * Math.sin(t * Math.PI * 2), // rise with wobble
];

/** Deterministic jitter so re-running produces the same series, not new noise. */
function jitter(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value); // 0..1
}

/**
 * Mirrors `calculatePriceStatus` in price-record.repository.ts. Duplicated
 * deliberately: this is a throwaway script and must not become a second import
 * path into production write logic.
 */
function statusFor(price: number, srp: number | null): 'COMPLIANT' | 'OVERPRICE' | 'UNDERPRICE' {
  if (srp == null) return 'COMPLIANT';
  if (price > srp) return 'OVERPRICE';
  if (price < srp) return 'UNDERPRICE';
  return 'COMPLIANT';
}

async function main() {
  const commodities = await prisma.commodity.findMany({
    where: { name: { in: TARGET_COMMODITIES } },
    select: {
      id: true,
      name: true,
      srps: { orderBy: { effectiveDate: 'desc' }, take: 1, select: { price: true } },
    },
  });

  if (commodities.length !== TARGET_COMMODITIES.length) {
    throw new Error(
      `Expected ${TARGET_COMMODITIES.length} commodities, found ${commodities.length}. Aborting rather than seeding a partial set.`,
    );
  }

  const stores = await prisma.store.findMany({ select: { id: true, name: true } });
  const officer = await prisma.user.findFirst({
    where: { role: 'OFFICER' },
    select: { id: true, email: true },
  });

  if (stores.length === 0) throw new Error('No stores exist to attach records to.');
  if (!officer) throw new Error('No OFFICER user exists to own these records.');

  const rows: Array<{
    id: string;
    commodityId: string;
    storeId: string;
    userId: string;
    price: number;
    dateAndTime: Date;
    status: 'COMPLIANT' | 'OVERPRICE' | 'UNDERPRICE';
  }> = [];

  const now = new Date();

  commodities
    // Keep the shape assignment stable regardless of the order the DB returns.
    .sort((a, b) => TARGET_COMMODITIES.indexOf(a.name) - TARGET_COMMODITIES.indexOf(b.name))
    .forEach((commodity, commodityIndex) => {
      const srp = commodity.srps[0] ? Number(commodity.srps[0].price) : null;
      const base = srp ?? 50;
      const shape = SHAPES[commodityIndex % SHAPES.length]!;

      for (let dayOffset = DAYS; dayOffset >= 0; dayOffset -= RECORD_EVERY_N_DAYS) {
        const t = (DAYS - dayOffset) / DAYS;

        // One store per visit, rotating, so store-level compliance also varies.
        const store = stores[(commodityIndex + dayOffset) % stores.length]!;

        const seed = commodityIndex * 1000 + dayOffset;
        const noise = (jitter(seed) - 0.5) * 0.05; // +/- 2.5%
        const storeBias = 1 + (stores.indexOf(store) - 1) * 0.02; // small per-store spread

        const price = Math.round(base * shape(t) * (1 + noise) * storeBias * 100) / 100;

        const dateAndTime = new Date(now);
        dateAndTime.setDate(dateAndTime.getDate() - dayOffset);
        // Mid-morning local, a plausible monitoring visit time.
        dateAndTime.setHours(9, 30, 0, 0);

        rows.push({
          id: crypto.randomUUID(),
          commodityId: commodity.id,
          storeId: store.id,
          userId: officer.id,
          price,
          dateAndTime,
          status: statusFor(price, srp),
        });
      }
    });

  console.log(`Seeding ${rows.length} price records across ${commodities.length} commodities...`);

  await prisma.priceRecord.createMany({ data: rows });

  writeFileSync(
    SEEDED_IDS_PATH,
    JSON.stringify(
      {
        seededAt: new Date().toISOString(),
        note: 'Demo price records written by scripts/seed-price-trends-demo.ts. Delete with scripts/unseed-price-trends-demo.ts.',
        commodities: commodities.map((c) => ({ id: c.id, name: c.name })),
        count: rows.length,
        ids: rows.map((r) => r.id),
      },
      null,
      2,
    ),
  );

  console.log(`Done. ${rows.length} ids recorded in ${SEEDED_IDS_PATH}`);
  console.log('Remove them with: npx tsx --import ./node_modules/dotenv/config scripts/unseed-price-trends-demo.ts');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
