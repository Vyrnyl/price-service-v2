/**
 * Imports the 2025 monthly store prices from the DTI Price and Supply
 * Monitoring Forms at the repo root (user-requested, 2026-11-12):
 *
 *   PRICE-RECORD-ARDCIMART-VIRAC-LUCKYSUPERMART.xlsx  sheets "ARDCIMART", "VIRAC LUCKYSUPERMART"
 *   SRP.xlsx                                          sheet "PSM Form" (ACC HYPERMART)
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/import-price-records-2025.ts [--apply | --undo]
 *
 * Without a flag this is a dry run: it reads both workbooks, reports what it
 * would write, and writes nothing.
 *
 * --apply, in one transaction:
 *   1. moves the catalogue's SRPs (those effective FROM_SRP_DATE, created by
 *      replace-commodities-srp-xlsx.ts) to TO_SRP_DATE, so the 2025 prices are
 *      judged against an SRP — the app treats a record with no SRP in force as
 *      COMPLIANT, which would have made every 2025 record read as compliant;
 *   2. creates one price record per store × catalogue item × month, dated the
 *      15th of the month at 09:00 Manila (01:00 UTC), owned by the demo
 *      officer, with the status the app would compute (SRP in force on that
 *      date: above → OVERPRICE, below → UNDERPRICE, equal or none → COMPLIANT).
 * Every created id (and the moved SRP ids) is written to MANIFEST_PATH before
 * the transaction, so --undo removes exactly those records and moves the SRPs
 * back, touching nothing else.
 *
 * Rows are matched to the catalogue by sheet row (all three forms share the
 * template), and each row's item name is checked against the catalogue so a
 * shifted sheet aborts instead of mis-assigning prices. Prices under half or
 * over double the item's own median for that store are treated as typos
 * (e.g. ₱1 for a ₱12.50 water) and skipped.
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { SRP_XLSX_ITEMS } from '../prisma/srp-xlsx-catalogue';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const REPO_ROOT = join(__dirname, '..', '..');
const SOURCES = [
  { file: 'PRICE-RECORD-ARDCIMART-VIRAC-LUCKYSUPERMART.xlsx', sheet: 'ARDCIMART' },
  { file: 'PRICE-RECORD-ARDCIMART-VIRAC-LUCKYSUPERMART.xlsx', sheet: 'VIRAC LUCKYSUPERMART' },
  { file: 'SRP.xlsx', sheet: 'PSM Form' },
];
const YEAR = 2025;
const MONTH_COLUMNS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // D..O = January..December
const FROM_SRP_DATE = new Date('2026-05-11T00:00:00.000Z');
const TO_SRP_DATE = new Date(`${YEAR}-01-01T00:00:00.000Z`);
const OFFICER_EMAIL = 'officer@presyoserbisyo.gov.ph';
const MANIFEST_PATH = join(__dirname, '.imported-price-records-2025.json');
const TX_OPTIONS = { maxWait: 20_000, timeout: 300_000 };

type Status = 'COMPLIANT' | 'OVERPRICE' | 'UNDERPRICE';
type NewRecord = {
  id: string;
  commodityId: string;
  storeId: string;
  userId: string;
  price: number;
  dateAndTime: Date;
  status: Status;
};
type Manifest = {
  appliedAt: string;
  status: 'applied' | 'undone';
  movedSrpIds: string[];
  fromSrpDate: string;
  toSrpDate: string;
  recordIds: string[];
  skippedTypos: string[];
};

const cellText = (value: ExcelJS.CellValue): string => {
  if (value == null) return '';
  if (typeof value === 'object') {
    const v = value as { result?: unknown; text?: unknown; richText?: { text: string }[] };
    if (v.richText) return v.richText.map((t) => t.text).join('');
    return String(v.result ?? v.text ?? '');
  }
  return String(value);
};
const normaliseStore = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '');
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** Same rule as price-record.repository's calculatePriceStatus. */
function statusFor(price: number, srp: number | undefined): Status {
  if (srp === undefined) return 'COMPLIANT';
  if (price > srp) return 'OVERPRICE';
  if (price < srp) return 'UNDERPRICE';
  return 'COMPLIANT';
}

async function plan() {
  const [stores, officer, commodities, srps, existingRecords] = await Promise.all([
    prisma.store.findMany({ select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { email: OFFICER_EMAIL }, select: { id: true } }),
    prisma.commodity.findMany({ select: { id: true, name: true } }),
    prisma.sRP.findMany({ select: { id: true, commodityId: true, price: true, effectiveDate: true } }),
    prisma.priceRecord.count(),
  ]);
  if (!officer) throw new Error(`No user ${OFFICER_EMAIL}.`);
  const storeByKey = new Map(stores.map((s) => [normaliseStore(s.name), s]));
  const commodityByName = new Map(commodities.map((c) => [c.name, c.id]));

  // SRPs to move: the catalogue's, still on their imported date.
  const toMove = srps.filter((s) => s.effectiveDate.getTime() === FROM_SRP_DATE.getTime());
  // SRP in force for the 2025 records once moved (every catalogue SRP is a single row).
  const srpByCommodity = new Map<string, number>();
  for (const s of srps) {
    const effective = s.effectiveDate.getTime() === FROM_SRP_DATE.getTime() ? TO_SRP_DATE : s.effectiveDate;
    if (effective.getTime() <= new Date(`${YEAR}-12-31T23:59:59Z`).getTime()) {
      srpByCommodity.set(s.commodityId, Number(s.price));
    }
  }

  const records: NewRecord[] = [];
  const skippedTypos: string[] = [];
  const perStore: Record<string, { records: number; typos: number }> = {};

  for (const source of SOURCES) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(join(REPO_ROOT, source.file));
    const sheet = workbook.getWorksheet(source.sheet);
    if (!sheet) throw new Error(`${source.file} has no sheet "${source.sheet}".`);
    const storeName = cellText(sheet.getCell('E7').value).trim();
    const store = storeByKey.get(normaliseStore(storeName));
    if (!store) throw new Error(`${source.file} › ${source.sheet}: store "${storeName}" is not in the store registry.`);
    perStore[store.name] = { records: 0, typos: 0 };

    for (const item of SRP_XLSX_ITEMS) {
      const sheetName = cellText(sheet.getCell(item.row, 1).value).replace(/\s+/g, ' ').trim();
      if (!item.name.toLowerCase().startsWith(sheetName.toLowerCase()) || !sheetName) {
        throw new Error(`${source.sheet} row ${item.row} is "${sheetName}", catalogue expects "${item.name}" — sheet layout differs.`);
      }
      const commodityId = commodityByName.get(item.name);
      if (!commodityId) throw new Error(`Commodity "${item.name}" is not in the database — run the catalogue import first.`);

      const months = MONTH_COLUMNS.map((col, index) => {
        const text = cellText(sheet.getCell(item.row, col).value).trim();
        return { month: index + 1, price: text === '' ? null : Number(text), text };
      });
      for (const m of months) {
        if (m.price !== null && !(m.price > 0)) throw new Error(`${source.sheet} row ${item.row} month ${m.month}: "${m.text}" is not a price.`);
      }
      const prices = months.filter((m) => m.price !== null).map((m) => m.price as number);
      const mid = prices.length ? median(prices) : 0;

      for (const m of months) {
        if (m.price === null) continue;
        if (m.price < mid * 0.5 || m.price > mid * 2) {
          skippedTypos.push(`${store.name} · ${item.name} · ${YEAR}-${String(m.month).padStart(2, '0')}: ₱${m.price} (median ₱${mid})`);
          perStore[store.name].typos++;
          continue;
        }
        records.push({
          id: randomUUID(),
          commodityId,
          storeId: store.id,
          userId: officer.id,
          price: m.price,
          dateAndTime: new Date(Date.UTC(YEAR, m.month - 1, 15, 1, 0, 0)), // 09:00 Manila
          status: statusFor(m.price, srpByCommodity.get(commodityId)),
        });
        perStore[store.name].records++;
      }
    }
  }

  return { records, skippedTypos, perStore, toMove, existingRecords };
}

async function apply(dryRun: boolean) {
  const { records, skippedTypos, perStore, toMove, existingRecords } = await plan();
  const byStatus = records.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});

  console.log(`Existing price records (left as they are): ${existingRecords}`);
  console.log(`SRPs to move ${FROM_SRP_DATE.toISOString().slice(0, 10)} → ${TO_SRP_DATE.toISOString().slice(0, 10)}: ${toMove.length}`);
  console.log('Would create price records:');
  for (const [store, n] of Object.entries(perStore)) console.log(`  ${store.padEnd(24)} ${String(n.records).padStart(5)} (typos skipped: ${n.typos})`);
  console.log(`  = ${records.length} records, ${YEAR}-01-15 … ${YEAR}-12-15, statuses ${JSON.stringify(byStatus)}`);
  console.log(`Typos skipped (${skippedTypos.length}):`);
  skippedTypos.forEach((t) => console.log(`  ${t}`));

  if (dryRun) {
    console.log('\n[dry run] no changes written. Re-run with --apply to commit.');
    return;
  }

  if (existsSync(MANIFEST_PATH)) {
    const existing = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
    if (existing.status === 'applied') throw new Error(`An applied manifest already exists at ${MANIFEST_PATH} — refusing to import twice.`);
  }
  const manifest: Manifest = {
    appliedAt: new Date().toISOString(),
    status: 'applied',
    movedSrpIds: toMove.map((s) => s.id),
    fromSrpDate: FROM_SRP_DATE.toISOString(),
    toSrpDate: TO_SRP_DATE.toISOString(),
    recordIds: records.map((r) => r.id),
    skippedTypos,
  };
  // Written BEFORE the transaction, so an interrupted run can still be undone.
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  await prisma.$transaction(async (tx) => {
    await tx.sRP.updateMany({ where: { id: { in: manifest.movedSrpIds } }, data: { effectiveDate: TO_SRP_DATE } });
    const CHUNK = 1000;
    for (let i = 0; i < records.length; i += CHUNK) {
      await tx.priceRecord.createMany({ data: records.slice(i, i + CHUNK) });
    }
  }, TX_OPTIONS);

  const [created, moved] = await Promise.all([
    prisma.priceRecord.count({ where: { id: { in: manifest.recordIds } } }),
    prisma.sRP.count({ where: { id: { in: manifest.movedSrpIds }, effectiveDate: TO_SRP_DATE } }),
  ]);
  console.log(`\nDone. Price records created ${created}/${records.length} | SRPs moved ${moved}/${toMove.length}`);
  if (created !== records.length || moved !== toMove.length) throw new Error('Post-apply counts do not match the plan — investigate.');
}

async function undo() {
  if (!existsSync(MANIFEST_PATH)) throw new Error(`No manifest at ${MANIFEST_PATH}.`);
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
  if (manifest.status !== 'applied') throw new Error(`Manifest status is "${manifest.status}" — nothing to undo.`);

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.priceRecord.deleteMany({ where: { id: { in: manifest.recordIds } } });
    const restored = await tx.sRP.updateMany({
      where: { id: { in: manifest.movedSrpIds }, effectiveDate: new Date(manifest.toSrpDate) },
      data: { effectiveDate: new Date(manifest.fromSrpDate) },
    });
    return { deleted: deleted.count, restored: restored.count };
  }, TX_OPTIONS);

  writeFileSync(MANIFEST_PATH, JSON.stringify({ ...manifest, status: 'undone' }, null, 2), 'utf8');
  console.log(`Undone: ${result.deleted} price records removed, ${result.restored} SRPs moved back.`);
}

async function main() {
  if (process.argv.includes('--undo')) await undo();
  else await apply(!process.argv.includes('--apply'));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
