/**
 * Brings every price record for the six demo commodities into a tight band
 * around each item's own SRP, so the Price Trends chart reads as a real trend
 * and the ARIMA forecast is not dragged by outliers.
 *
 * Before this ran, the live data held records at +308% of SRP (PHP 148 against a
 * PHP 36.25 SRP) and -82% (PHP 25 against PHP 142). A single outlier like that both
 * flattens the chart's y-axis and destabilises the forecast.
 *
 * THIS REWRITES ROWS IN THE LIVE DATABASE, including records that predate the
 * demo seeding. Every original value is written to
 * `scripts/.price-trends-backup.json` first, and
 * `scripts/restore-price-trends-backup.ts` puts them all back.
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/normalize-price-trends-demo.ts
 *   npx tsx --import ./node_modules/dotenv/config scripts/restore-price-trends-backup.ts
 */

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BACKUP_PATH = join(__dirname, '.price-trends-backup.json');

/**
 * Prices stay within +/- this fraction of SRP. Wide enough for the trend line to
 * have visible shape and for both compliant and above-SRP records to occur
 * naturally; tight enough that the forecast sees a stable series.
 */
const BAND = 0.10;

const TARGET_COMMODITIES = [
  '5-STAR Esperma (White) 25pcs/pack',
  '5-STAR Esperma (White) 25pcs/pack (2)',
  '5-STAR Esperma (White)#14 4pcs/pack',
  '5-STAR Esperma (White)#22 2pcs/pack',
  '5-STAR Esperma (White)#8 5pcs/pack',
  '555 BONUS Pack Sardines (green) 155g',
];

/**
 * Gentle shapes as a multiplier of SRP, all staying inside the band. Each
 * commodity gets a different one so the six charts do not look copy-pasted, but
 * none of them lurches: the largest single step between consecutive records is
 * a couple of percent.
 */
const SHAPES: Array<(t: number) => number> = [
  (t) => 1 - BAND * 0.7 + BAND * 1.3 * t, //          slow climb across the band
  (t) => 1 + BAND * 0.7 - BAND * 1.3 * t, //          slow decline across the band
  (t) => 1 + BAND * 0.6 * Math.sin(t * Math.PI * 1.2), // shallow wave
  // Centred on SRP so this one crosses the line in both directions rather than
  // sitting permanently above it and reading as always non-compliant.
  (t) => 1 + BAND * 0.55 - BAND * 1.9 * t + BAND * 1.35 * t * t, // dip and recover
  (t) => 1 - BAND * 0.2 + BAND * 0.35 * Math.sin(t * Math.PI * 2), // near-flat ripple
  (t) => 1 - BAND * 0.6 + BAND * 1.1 * t - BAND * 0.3 * Math.sin(t * Math.PI * 2), // climb with slight wobble
];

/** Deterministic, so re-running produces the same series rather than new noise. */
function jitter(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value); // 0..1
}

/** Mirrors `calculatePriceStatus` in price-record.repository.ts. */
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
      prices: {
        orderBy: { dateAndTime: 'asc' },
        select: { id: true, price: true, dateAndTime: true, status: true },
      },
    },
  });

  if (commodities.length !== TARGET_COMMODITIES.length) {
    throw new Error(
      `Expected ${TARGET_COMMODITIES.length} commodities, found ${commodities.length}. Aborting.`,
    );
  }

  // Back up first, and never overwrite an existing backup — a second run would
  // otherwise capture already-normalized values and lose the true originals.
  if (existsSync(BACKUP_PATH)) {
    console.log(`Backup already exists at ${BACKUP_PATH} — keeping it (it holds the true original values).`);
  } else {
    const backup = commodities.flatMap((commodity) =>
      commodity.prices.map((row) => ({
        id: row.id,
        commodityName: commodity.name,
        price: Number(row.price),
        status: row.status,
      })),
    );

    writeFileSync(
      BACKUP_PATH,
      JSON.stringify(
        {
          backedUpAt: new Date().toISOString(),
          note: 'Original price/status values before scripts/normalize-price-trends-demo.ts. Restore with scripts/restore-price-trends-backup.ts.',
          count: backup.length,
          records: backup,
        },
        null,
        2,
      ),
    );
    console.log(`Backed up ${backup.length} original values to ${BACKUP_PATH}`);
  }

  const updates: Array<{ id: string; price: number; status: ReturnType<typeof statusFor> }> = [];

  commodities
    .sort((a, b) => TARGET_COMMODITIES.indexOf(a.name) - TARGET_COMMODITIES.indexOf(b.name))
    .forEach((commodity, commodityIndex) => {
      const srp = commodity.srps[0] ? Number(commodity.srps[0].price) : null;
      if (srp == null) {
        console.log(`  ${commodity.name}: no SRP, skipped`);
        return;
      }

      const shape = SHAPES[commodityIndex % SHAPES.length]!;
      const rows = commodity.prices;
      const lastIndex = Math.max(rows.length - 1, 1);

      rows.forEach((row, rowIndex) => {
        // Position within this commodity's own series, so pre-existing records
        // are placed on the same curve as the seeded ones rather than being
        // treated as a separate population.
        const t = rowIndex / lastIndex;

        // +/- 1.5% of SRP, small enough that consecutive points never jump.
        const noise = (jitter(commodityIndex * 1000 + rowIndex) - 0.5) * 0.03;

        const price = Math.round(srp * (shape(t) + noise) * 100) / 100;
        updates.push({ id: row.id, price, status: statusFor(price, srp) });
      });
    });

  console.log(`Rewriting ${updates.length} price records into a +/-${BAND * 100}% band around SRP...`);

  // Chunked so a large update set does not open one very long transaction.
  const CHUNK = 50;
  for (let start = 0; start < updates.length; start += CHUNK) {
    const chunk = updates.slice(start, start + CHUNK);
    await prisma.$transaction(
      chunk.map((update) =>
        prisma.priceRecord.update({
          where: { id: update.id },
          data: { price: update.price, status: update.status },
        }),
      ),
    );
  }

  console.log(`Done. ${updates.length} records normalized.`);
  console.log('Restore originals with: npx tsx --import ./node_modules/dotenv/config scripts/restore-price-trends-backup.ts');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
