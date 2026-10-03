/**
 * Seeds demo price records for a named batch of BNPC commodities, so the Price
 * Trends chart, forecast, dashboards and Store Compliance have a real series
 * to render.
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/seed-bnpc-price-records.ts \
 *     [--batch <name>] [--apply | --undo]
 *
 * Batches (see BATCHES):
 *   first-five   (default) the first five commodities by name, ~90 days, 2–3 stores per visit
 *   555-to-cdo   "555 Beef Loaf 150g" through "CDO Meat Loaf 150g", ~30 days, 1–2 stores
 *                per visit, at least 15 records each
 *
 * Without --apply this is a dry run: it prints the target commodities and the
 * generated series' spread, and writes nothing.
 *
 * THIS WRITES TO THE LIVE DATABASE — there is no separate dev DB. Each batch
 * writes its created ids to its own manifest before the insert, and --undo
 * deletes exactly that batch's ids and nothing else.
 *
 * The generator mirrors prisma/seed.ts: every point stays inside ±PRICE_BAND
 * of the item's own SRP, each commodity gets a shape that crosses its SRP (so
 * no item reads as permanently over- or under-priced), and officers visit
 * every other day. Status is judged against the SRP in force on each record's
 * date, as the app does on create.
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type Batch = {
  manifest: string;
  /** Commodities by `name: asc`, the order the app lists them in. */
  select: { take: number } | { fromName: string; toName: string };
  days: number;
  daysBetweenVisits: number;
  /** Stores recorded per visit, alternating visit by visit. */
  storesPerVisit: [number, number];
  minRecords?: number;
};

const BATCHES: Record<string, Batch> = {
  'first-five': {
    manifest: '.seeded-bnpc-price-records.json',
    select: { take: 5 },
    days: 90,
    daysBetweenVisits: 2,
    storesPerVisit: [2, 3],
  },
  '555-to-cdo': {
    manifest: '.seeded-bnpc-price-records-555-to-cdo.json',
    select: { fromName: '555 Beef Loaf 150g', toName: 'CDO Meat Loaf 150g' },
    days: 30,
    daysBetweenVisits: 2,
    storesPerVisit: [1, 2],
    minRecords: 15,
  },
};

const PRICE_BAND = 0.1;
const NOISE_SHARE = 0.2;
const MANILA_OFFSET_HOURS = 8;

type PriceStatus = 'COMPLIANT' | 'OVERPRICE' | 'UNDERPRICE';

type Manifest = { status: 'pending' | 'applied' | 'undone'; seededAt: string; ids: string[] };

const SHAPES: Array<(t: number) => number> = [
  (t) => -0.7 + 1.4 * t, // steady rise through SRP
  (t) => 0.7 - 1.4 * t, // decline through SRP
  (t) => Math.sin(t * Math.PI * 2) * 0.8, // full wave
  (t) => 0.45 - Math.sin(t * Math.PI) * 0.9, // dip and recover, centred on SRP
  (t) => -0.5 + t * 1.0 + Math.sin(t * Math.PI * 3) * 0.3, // rise with wobble
  (t) => Math.sin(t * Math.PI * 4) * 0.35, // near-flat ripple
];

function jitter(seed: number, index: number): number {
  const x = Math.sin(seed * 127.1 + index * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // -1..1
}

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) % 100000;
  }
  return h;
}

function srpOn(srps: { price: number; effectiveDate: Date }[], date: Date): number | null {
  const inForce = srps.filter((s) => s.effectiveDate <= date);
  return inForce.length ? inForce[inForce.length - 1].price : null;
}

function statusFor(price: number, srp: number | null): PriceStatus {
  if (srp === null || price === srp) return 'COMPLIANT';
  return price > srp ? 'OVERPRICE' : 'UNDERPRICE';
}

function readManifest(path: string): Manifest | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Manifest) : null;
}

async function selectCommodities(batch: Batch) {
  const all = await prisma.commodity.findMany({
    orderBy: { name: 'asc' },
    include: { srps: { orderBy: { effectiveDate: 'asc' } } },
  });
  if ('take' in batch.select) return all.slice(0, batch.select.take);

  const { fromName, toName } = batch.select;
  const from = all.findIndex((c) => c.name === fromName);
  const to = all.findIndex((c) => c.name === toName);
  if (from < 0 || to < 0 || to < from) throw new Error(`Range "${fromName}" → "${toName}" not found in order.`);
  return all.slice(from, to + 1);
}

async function seed(batch: Batch, manifestPath: string, dryRun: boolean) {
  const manifest = readManifest(manifestPath);
  if (manifest && manifest.status !== 'undone') {
    throw new Error(`A ${manifest.status} manifest already exists at ${manifestPath} — run --undo first.`);
  }

  const commodities = await selectCommodities(batch);
  const stores = await prisma.store.findMany({ orderBy: { name: 'asc' } });
  if (stores.length === 0) throw new Error('No stores to record prices against.');

  const existing = await prisma.priceRecord.count({ where: { commodityId: { in: commodities.map((c) => c.id) } } });
  if (existing > 0) throw new Error(`The target commodities already have ${existing} price records.`);

  const now = new Date();
  const rows: Array<{
    id: string;
    commodityId: string;
    storeId: string;
    userId: string;
    price: number;
    dateAndTime: Date;
    status: PriceStatus;
  }> = [];

  for (const [index, commodity] of commodities.entries()) {
    const srps = commodity.srps.map((s) => ({ price: Number(s.price), effectiveDate: s.effectiveDate }));
    const current = srpOn(srps, now);
    if (current === null) throw new Error(`${commodity.name} has no SRP in force.`);

    const seed = hashName(commodity.name);
    // Shapes by position, so neighbouring items in the list never look alike.
    const shape = SHAPES[index % SHAPES.length];
    const storeOffset = seed % stores.length;

    for (let dayOffset = batch.days; dayOffset >= 0; dayOffset -= batch.daysBetweenVisits) {
      const step = (batch.days - dayOffset) / batch.daysBetweenVisits;
      const t = (batch.days - dayOffset) / batch.days;
      const storesToday = Math.min(stores.length, batch.storesPerVisit[step % 2]);

      for (let s = 0; s < storesToday; s += 1) {
        // Rotate the store each visit so a single-store visit is not always the same shop.
        const store = stores[(storeOffset + step + s) % stores.length];

        // A working-hours visit (08:00–15:59 Manila), on the Manila calendar day.
        const date = new Date(now);
        date.setUTCDate(date.getUTCDate() - dayOffset);
        date.setUTCHours(8 + ((step + s) % 8) - MANILA_OFFSET_HOURS, (seed + s * 17) % 60, 0, 0);
        if (date > now) continue;

        const trend = shape(t) * PRICE_BAND * (1 - NOISE_SHARE);
        const storeNoise = jitter(seed + s * 991, step) * PRICE_BAND * NOISE_SHARE;
        const price = Math.max(0.5, Number((current * (1 + trend + storeNoise)).toFixed(2)));

        rows.push({
          id: randomUUID(),
          commodityId: commodity.id,
          storeId: store.id,
          // The officer who owns the store — officer views are scoped to their own records.
          userId: store.userId,
          price,
          dateAndTime: date,
          status: statusFor(price, srpOn(srps, date)),
        });
      }
    }
  }

  console.log(`Stores: ${stores.map((s) => s.name).join(', ')}`);
  for (const commodity of commodities) {
    const mine = rows.filter((r) => r.commodityId === commodity.id);
    const prices = mine.map((r) => r.price);
    const count = (status: PriceStatus) => mine.filter((r) => r.status === status).length;
    console.log(
      `  ${commodity.name.slice(0, 44).padEnd(44)} SRP ₱${Number(commodity.srps.at(-1)!.price).toFixed(2).padStart(7)} | ` +
        `${String(mine.length).padStart(3)} records ₱${Math.min(...prices).toFixed(2)}–₱${Math.max(...prices).toFixed(2)} | ` +
        `above ${count('OVERPRICE')} · below ${count('UNDERPRICE')} · at ${count('COMPLIANT')}`,
    );
    if (batch.minRecords && mine.length < batch.minRecords) {
      throw new Error(`${commodity.name} would get ${mine.length} records, below the minimum of ${batch.minRecords}.`);
    }
  }
  console.log(`Total: ${rows.length} price records for ${commodities.length} commodities over ${batch.days} days.`);

  if (dryRun) {
    console.log('\n[dry run] no changes written. Re-run with --apply to commit.');
    return;
  }

  // Recorded before the insert, so a failure part-way can still be undone.
  const write = (status: Manifest['status']) =>
    writeFileSync(
      manifestPath,
      JSON.stringify({ status, seededAt: now.toISOString(), ids: rows.map((r) => r.id) }, null, 2),
      'utf8',
    );
  write('pending');
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.priceRecord.createMany({ data: rows.slice(i, i + CHUNK) });
  }
  write('applied');
  console.log(`\nCreated ${rows.length} price records. Manifest: ${manifestPath}`);
}

async function undo(manifestPath: string) {
  const manifest = readManifest(manifestPath);
  if (!manifest || manifest.status === 'undone') throw new Error('Nothing to undo.');
  const result = await prisma.priceRecord.deleteMany({ where: { id: { in: manifest.ids } } });
  writeFileSync(manifestPath, JSON.stringify({ ...manifest, status: 'undone' }, null, 2), 'utf8');
  console.log(`Deleted ${result.count} of ${manifest.ids.length} seeded price records.`);
}

async function main() {
  const batchFlag = process.argv.indexOf('--batch');
  const name = batchFlag >= 0 ? process.argv[batchFlag + 1] : 'first-five';
  const batch = BATCHES[name];
  if (!batch) throw new Error(`Unknown batch "${name}". Known: ${Object.keys(BATCHES).join(', ')}`);
  const manifestPath = join(__dirname, batch.manifest);

  if (process.argv.includes('--undo')) {
    await undo(manifestPath);
  } else {
    await seed(batch, manifestPath, !process.argv.includes('--apply'));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
