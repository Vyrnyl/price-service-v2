/**
 * Gives the 2025 monthly price records a date range (user-requested,
 * 2026-11-14, after PriceRecord.periodEnd was added).
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/range-price-records-2025.ts [--apply | --undo]
 *
 * The DTI forms (SRP.xlsx and PRICE-RECORD-ARDCIMART-VIRAC-LUCKYSUPERMART.xlsx)
 * record one price per store, item and MONTH. import-price-records-2025.ts
 * dated each one the 15th at 09:00 Manila, before ranges existed. This script
 * makes each record cover its whole month, the way the app saves a range:
 *
 *   dateAndTime  15th 09:00 Manila  →  the 1st of the month (00:00 UTC)
 *   periodEnd    null               →  the last day of the month (00:00 UTC)
 *
 * Calendar dates at 00:00 UTC are the app's convention for range ends and SRP
 * effective dates alike (frontend shared/utils/date-range.ts), so the list reads
 * "Jan 1 – Jan 31, 2025 · 31 days".
 *
 * Only records listed in the import's manifest
 * (scripts/.imported-price-records-2025.json) are touched, and only while they
 * still carry the import's exact timestamp and no range — a record edited
 * since then is left alone. Status is unchanged: every catalogue SRP took
 * effect 2025-01-01 (00:00 UTC), which is also the earliest new start, and
 * the script refuses to run if any SRP takes effect inside 2025 after that.
 *
 * Without a flag this is a dry run (reads only). --apply writes the updated
 * ids to MANIFEST_PATH first, then updates in one statement. --undo moves
 * exactly those ids back to the 15th 09:00 Manila with no range.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const IMPORT_MANIFEST = join(__dirname, '.imported-price-records-2025.json');
const MANIFEST_PATH = join(__dirname, '.ranged-price-records-2025.json');
const YEAR_START = new Date('2025-01-01T00:00:00.000Z');
const YEAR_END = new Date('2026-01-01T00:00:00.000Z');

type Manifest = { appliedAt: string; status: 'applied' | 'undone'; recordIds: string[] };

// Stored timestamps are UTC ("timestamp without time zone").
// Import stamp: the 15th at 01:00 UTC (09:00 Manila). Month start: the 1st at
// 00:00 UTC. Month end: the last day at 00:00 UTC.
const IS_IMPORT_STAMP = `extract(day from "dateAndTime") = 15 AND "dateAndTime"::time = '01:00:00'`;
const MONTH_START = `date_trunc('month', "dateAndTime")`;
const MONTH_END = `date_trunc('month', "dateAndTime") + interval '1 month' - interval '1 day'`;

async function eligibleIds(): Promise<string[]> {
  if (!existsSync(IMPORT_MANIFEST)) throw new Error(`${IMPORT_MANIFEST} not found — nothing to scope by.`);
  const imported = JSON.parse(readFileSync(IMPORT_MANIFEST, 'utf8')) as { status: string; recordIds: string[] };
  if (imported.status !== 'applied') throw new Error('The 2025 import is not applied.');
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id::text FROM "PriceRecord" WHERE id = ANY($1::uuid[]) AND "periodEnd" IS NULL AND ${IS_IMPORT_STAMP}`,
    imported.recordIds,
  );
  return rows.map((r) => r.id);
}

async function assertStatusUnchanged() {
  const srpsInsideYear = await prisma.sRP.count({
    where: { effectiveDate: { gt: YEAR_START, lt: YEAR_END } },
  });
  if (srpsInsideYear > 0) {
    throw new Error(`${srpsInsideYear} SRP(s) take effect during 2025 — moving records to the 1st could change their status. Aborting.`);
  }
}

async function dryRun() {
  const imported = JSON.parse(readFileSync(IMPORT_MANIFEST, 'utf8')) as { recordIds: string[] };
  const ids = await eligibleIds();
  await assertStatusUnchanged();
  const preview = await prisma.$queryRawUnsafe<{ month: string; n: bigint; start: Date; end: Date }[]>(
    `SELECT to_char("dateAndTime", 'YYYY-MM') AS month, count(*) AS n,
            min(${MONTH_START}) AS start, min(${MONTH_END}) AS "end"
       FROM "PriceRecord" WHERE id = ANY($1::uuid[]) GROUP BY 1 ORDER BY 1`,
    ids,
  );
  console.log(`Import manifest: ${imported.recordIds.length} ids · eligible (import stamp, no range): ${ids.length}`);
  for (const p of preview) {
    console.log(`  ${p.month}: ${String(p.n).padStart(5)} records → ${p.start.toISOString()} … ${p.end.toISOString()} (UTC)`);
  }
  console.log('Dry run — nothing written. Re-run with --apply.');
}

async function apply() {
  const ids = await eligibleIds();
  await assertStatusUnchanged();
  if (ids.length === 0) return console.log('Nothing to update.');
  const manifest: Manifest = { appliedAt: new Date().toISOString(), status: 'applied', recordIds: ids };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  const updated = await prisma.$executeRawUnsafe(
    `UPDATE "PriceRecord" SET "periodEnd" = ${MONTH_END}, "dateAndTime" = ${MONTH_START}
      WHERE id = ANY($1::uuid[]) AND "periodEnd" IS NULL AND ${IS_IMPORT_STAMP}`,
    ids,
  );
  console.log(`Updated ${updated} of ${ids.length} records. Manifest: ${MANIFEST_PATH}`);
}

async function undo() {
  if (!existsSync(MANIFEST_PATH)) throw new Error(`${MANIFEST_PATH} not found — nothing to undo.`);
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
  if (manifest.status !== 'applied') throw new Error('Manifest is not in the applied state.');
  // Only rows still exactly as this script left them (the 1st, ending the month's last day).
  const restored = await prisma.$executeRawUnsafe(
    `UPDATE "PriceRecord"
        SET "dateAndTime" = date_trunc('month', "dateAndTime") + interval '14 days 1 hour',
            "periodEnd" = NULL
      WHERE id = ANY($1::uuid[])
        AND "dateAndTime" = ${MONTH_START}
        AND "periodEnd" = ${MONTH_END}`,
    manifest.recordIds,
  );
  writeFileSync(MANIFEST_PATH, JSON.stringify({ ...manifest, status: 'undone' }, null, 2));
  console.log(`Restored ${restored} of ${manifest.recordIds.length} records to the 15th 09:00 Manila, no range.`);
}

const mode = process.argv.includes('--apply') ? apply : process.argv.includes('--undo') ? undo : dryRun;
mode()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
