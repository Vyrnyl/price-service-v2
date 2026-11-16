/**
 * Removes every commodity and price record, ahead of importing the weekly
 * 2025/2026 SRP and price-record files (user, 2026-11-16).
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/clear-commodities.ts [--apply | --undo]
 *
 * Without a flag this is a dry run: it counts what would be removed and writes
 * nothing.
 *
 * --apply deletes every PriceRecord, Forecast, SRP and Commodity — SRPs and
 * forecasts go too because they reference a commodity with no cascade.
 * Categories, stores, users, reports and the audit log are not touched. Every
 * row about to be removed is written to BACKUP_PATH first, and the deletes run
 * in one transaction, so a failure part-way leaves everything in place.
 *
 * --undo puts the backed-up rows back with their original ids and timestamps.
 * It refuses while any commodity exists (a later import would collide or be
 * mixed in), unless --force is given — in which case it does NOT delete those
 * newer rows; a name clash makes the insert fail and the transaction roll back.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BACKUP_PATH = join(__dirname, '.clear-commodities-2026-11-16-backup.json');

// Neon round-trips are slow enough that the 5 s default would expire the
// transaction part-way through.
const TX_OPTIONS = { maxWait: 20_000, timeout: 300_000 };
const CHUNK = 2_000;

type Backup = {
  takenAt: string;
  status: 'applied' | 'undone';
  commodities: Record<string, unknown>[];
  srps: Record<string, unknown>[];
  priceRecords: Record<string, unknown>[];
  forecasts: Record<string, unknown>[];
};

async function counts() {
  const [commodities, srps, priceRecords, forecasts, categories, stores, reports] = await Promise.all([
    prisma.commodity.count(),
    prisma.sRP.count(),
    prisma.priceRecord.count(),
    prisma.forecast.count(),
    prisma.category.count(),
    prisma.store.count(),
    prisma.report.count(),
  ]);
  return { commodities, srps, priceRecords, forecasts, categories, stores, reports };
}

async function apply(dryRun: boolean) {
  const before = await counts();
  console.log('Current rows:', before);
  console.log(
    `Would delete: ${before.priceRecords} price records, ${before.forecasts} forecasts, ` +
      `${before.srps} SRPs, ${before.commodities} commodities. ` +
      `Kept: ${before.categories} categories, ${before.stores} stores, ${before.reports} reports, users, audit log.`,
  );
  if (dryRun) {
    console.log('\nDry run — nothing written. Re-run with --apply to delete.');
    return;
  }

  if (existsSync(BACKUP_PATH)) {
    const existing = JSON.parse(readFileSync(BACKUP_PATH, 'utf8')) as Backup;
    if (existing.status === 'applied') {
      throw new Error(`A backup from an applied run already exists at ${BACKUP_PATH} — refusing to overwrite it.`);
    }
  }

  const [commodities, srps, priceRecords, forecasts] = await Promise.all([
    prisma.commodity.findMany(),
    prisma.sRP.findMany(),
    prisma.priceRecord.findMany(),
    prisma.forecast.findMany(),
  ]);
  const backup: Backup = {
    takenAt: new Date().toISOString(),
    status: 'applied',
    commodities,
    srps,
    priceRecords,
    forecasts,
  };
  writeFileSync(BACKUP_PATH, JSON.stringify(backup), 'utf8');
  console.log(`Backup written: ${BACKUP_PATH}`);

  await prisma.$transaction(async (tx) => {
    await tx.priceRecord.deleteMany({});
    await tx.forecast.deleteMany({});
    await tx.sRP.deleteMany({});
    await tx.commodity.deleteMany({});
  }, TX_OPTIONS);

  console.log('Deleted. Rows now:', await counts());
}

async function undo(force: boolean) {
  if (!existsSync(BACKUP_PATH)) throw new Error(`No backup at ${BACKUP_PATH}.`);
  const backup = JSON.parse(readFileSync(BACKUP_PATH, 'utf8')) as Backup;
  if (backup.status !== 'applied') throw new Error(`Backup status is "${backup.status}" — nothing to undo.`);
  const now = await counts();
  if (now.commodities > 0 && !force) {
    throw new Error(`${now.commodities} commodities exist now — refusing to restore on top of them (use --force).`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.commodity.createMany({ data: backup.commodities as never });
    await tx.sRP.createMany({ data: backup.srps as never });
    for (let i = 0; i < backup.priceRecords.length; i += CHUNK) {
      await tx.priceRecord.createMany({ data: backup.priceRecords.slice(i, i + CHUNK) as never });
    }
    await tx.forecast.createMany({ data: backup.forecasts as never });
  }, TX_OPTIONS);

  writeFileSync(BACKUP_PATH, JSON.stringify({ ...backup, status: 'undone' }), 'utf8');
  console.log('Restored. Rows now:', await counts());
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--undo')) await undo(args.includes('--force'));
  else await apply(!args.includes('--apply'));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
