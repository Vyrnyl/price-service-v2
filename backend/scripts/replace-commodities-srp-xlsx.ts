/**
 * Replaces the whole commodity catalogue with the items in SRP.xlsx (DTI Price
 * and Supply Monitoring Form), transcribed in prisma/srp-xlsx-catalogue.ts.
 * The catalogue it replaces was test data (user, 2026-11-12).
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/replace-commodities-srp-xlsx.ts [--apply | --undo]
 *
 * Without a flag this is a dry run: it reports exactly what would be removed
 * and created, and writes nothing.
 *
 * --apply removes every PriceRecord, Forecast, SRP, Commodity and Category,
 * then creates the sheet's categories and commodities, plus one SRP (effective
 * SRP_EFFECTIVE_DATE) for every item that has one. Items marked "NO SRP" become
 * commodities without an SRP. Stores, users, reports and the audit log are not
 * touched. Every row about to be removed is written to BACKUP_PATH first, and
 * the delete and the inserts run in one transaction, so a failure part-way
 * leaves the old catalogue in place.
 *
 * --undo puts the backed-up rows back (original ids and timestamps) after
 * removing this catalogue. It refuses while price records exist that are not
 * in the backup, since those would be lost, unless --force is given.
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { SRP_EFFECTIVE_DATE, SRP_XLSX_CATEGORIES, SRP_XLSX_ITEMS } from '../prisma/srp-xlsx-catalogue';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BACKUP_PATH = join(__dirname, '.srp-xlsx-replacement-backup.json');

// Neon round-trips are slow enough that the 5 s default would expire the
// transaction part-way through.
const TX_OPTIONS = { maxWait: 20_000, timeout: 180_000 };

// The app stores a date-only effective date as UTC midnight (z.coerce.date()
// on "YYYY-MM-DD"), so the imported SRPs follow the same convention.
const effectiveDate = new Date(`${SRP_EFFECTIVE_DATE}T00:00:00.000Z`);

type Backup = {
  takenAt: string;
  status: 'applied' | 'undone';
  categories: Record<string, unknown>[];
  commodities: Record<string, unknown>[];
  srps: Record<string, unknown>[];
  priceRecords: Record<string, unknown>[];
  forecasts: Record<string, unknown>[];
};

function validateItems() {
  const names = new Set<string>();
  const categories = new Set(SRP_XLSX_CATEGORIES);
  for (const item of SRP_XLSX_ITEMS) {
    const key = item.name.toLowerCase();
    if (names.has(key)) throw new Error(`Duplicate commodity name: ${item.name}`);
    names.add(key);
    if (!categories.has(item.category)) throw new Error(`Unknown category "${item.category}" for ${item.name}`);
    if (item.srp !== null && (!(item.srp > 0) || Math.abs(Math.round(item.srp * 100) - item.srp * 100) > 1e-6)) {
      throw new Error(`Bad SRP ${item.srp} for ${item.name}`);
    }
  }
}

function plan() {
  const categories = SRP_XLSX_CATEGORIES.map((name) => ({ id: randomUUID(), name }));
  const categoryId = new Map(categories.map((c) => [c.name, c.id]));

  const commodities = SRP_XLSX_ITEMS.map((item) => ({
    id: randomUUID(),
    name: item.name,
    status: 'Active',
    categoryId: categoryId.get(item.category)!,
  }));

  const srps = SRP_XLSX_ITEMS.flatMap((item, i) =>
    item.srp === null ? [] : [{ commodityId: commodities[i].id, price: item.srp, effectiveDate }],
  );

  return { categories, commodities, srps };
}

async function currentCounts() {
  const [categories, commodities, srps, priceRecords, forecasts, reports, stores] = await Promise.all([
    prisma.category.count(),
    prisma.commodity.count(),
    prisma.sRP.count(),
    prisma.priceRecord.count(),
    prisma.forecast.count(),
    prisma.report.count(),
    prisma.store.count(),
  ]);
  return { categories, commodities, srps, priceRecords, forecasts, reports, stores };
}

async function apply(dryRun: boolean) {
  validateItems();
  const before = await currentCounts();
  const { categories, commodities, srps } = plan();

  console.log('Would remove:');
  console.log(`  ${before.priceRecords} price records`);
  console.log(`  ${before.forecasts} forecasts`);
  console.log(`  ${before.srps} SRPs`);
  console.log(`  ${before.commodities} commodities`);
  console.log(`  ${before.categories} categories`);
  console.log(`Untouched: ${before.stores} stores, ${before.reports} reports, users, audit log.`);

  console.log('\nWould create:');
  for (const category of categories) {
    const inCategory = commodities.filter((c) => c.categoryId === category.id);
    const priced = srps.filter((s) => inCategory.some((c) => c.id === s.commodityId)).length;
    console.log(`  ${category.name.padEnd(34)} ${String(inCategory.length).padStart(3)} commodities, ${String(priced).padStart(3)} with SRP`);
  }
  console.log(`  = ${categories.length} categories, ${commodities.length} commodities, ` +
    `${srps.length} SRPs effective ${SRP_EFFECTIVE_DATE} (${commodities.length - srps.length} without an SRP)`);

  if (dryRun) {
    console.log('\n[dry run] no changes written. Re-run with --apply to commit.');
    return;
  }

  if (existsSync(BACKUP_PATH)) {
    const existing = JSON.parse(readFileSync(BACKUP_PATH, 'utf8')) as Backup;
    if (existing.status === 'applied') {
      throw new Error(`A backup from an applied run already exists at ${BACKUP_PATH} — refusing to overwrite it.`);
    }
  }

  const [oldCategories, oldCommodities, oldSrps, oldPriceRecords, oldForecasts] = await Promise.all([
    prisma.category.findMany(),
    prisma.commodity.findMany(),
    prisma.sRP.findMany(),
    prisma.priceRecord.findMany(),
    prisma.forecast.findMany(),
  ]);
  const backup: Backup = {
    takenAt: new Date().toISOString(),
    status: 'applied',
    categories: oldCategories,
    commodities: oldCommodities,
    srps: oldSrps,
    priceRecords: oldPriceRecords,
    forecasts: oldForecasts,
  };
  // Written BEFORE the transaction, so the old rows survive on disk even if
  // the process dies mid-way.
  writeFileSync(BACKUP_PATH, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`\nBacked up ${oldCategories.length} categories, ${oldCommodities.length} commodities, ` +
    `${oldSrps.length} SRPs, ${oldPriceRecords.length} price records, ${oldForecasts.length} forecasts to ${BACKUP_PATH}`);

  await prisma.$transaction(async (tx) => {
    await tx.priceRecord.deleteMany({});
    await tx.forecast.deleteMany({});
    await tx.sRP.deleteMany({});
    await tx.commodity.deleteMany({});
    await tx.category.deleteMany({});
    await tx.category.createMany({ data: categories });
    await tx.commodity.createMany({ data: commodities });
    await tx.sRP.createMany({ data: srps });
  }, TX_OPTIONS);

  const after = await currentCounts();
  console.log(`\nDone. Categories ${after.categories} | commodities ${after.commodities} | SRPs ${after.srps} | ` +
    `price records ${after.priceRecords} | forecasts ${after.forecasts}`);
  if (after.commodities !== commodities.length || after.srps !== srps.length || after.categories !== categories.length) {
    throw new Error('Post-apply counts do not match the plan — investigate before trusting the data.');
  }
}

async function undo(force: boolean) {
  if (!existsSync(BACKUP_PATH)) throw new Error(`No backup at ${BACKUP_PATH}.`);
  const backup = JSON.parse(readFileSync(BACKUP_PATH, 'utf8')) as Backup;
  if (backup.status !== 'applied') throw new Error(`Backup status is "${backup.status}" — nothing to undo.`);

  const backedUpIds = new Set(backup.priceRecords.map((r) => r.id as string));
  const live = await prisma.priceRecord.findMany({ select: { id: true } });
  const newRecords = live.filter((r) => !backedUpIds.has(r.id)).length;
  if (newRecords > 0 && !force) {
    throw new Error(`${newRecords} price record(s) were added after the replacement and would be lost. ` +
      'Re-run with --undo --force to discard them.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.priceRecord.deleteMany({});
    await tx.forecast.deleteMany({});
    await tx.sRP.deleteMany({});
    await tx.commodity.deleteMany({});
    await tx.category.deleteMany({});
    // createMany accepts the ISO date and decimal strings JSON round-tripping produced.
    await tx.category.createMany({ data: backup.categories as never });
    await tx.commodity.createMany({ data: backup.commodities as never });
    await tx.sRP.createMany({ data: backup.srps as never });
    const CHUNK = 1000;
    for (let i = 0; i < backup.priceRecords.length; i += CHUNK) {
      await tx.priceRecord.createMany({ data: backup.priceRecords.slice(i, i + CHUNK) as never });
    }
    await tx.forecast.createMany({ data: backup.forecasts as never });
  }, TX_OPTIONS);

  writeFileSync(BACKUP_PATH, JSON.stringify({ ...backup, status: 'undone' }, null, 2), 'utf8');
  console.log('Restored:', await currentCounts());
}

async function main() {
  if (process.argv.includes('--undo')) {
    await undo(process.argv.includes('--force'));
  } else {
    await apply(!process.argv.includes('--apply'));
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
