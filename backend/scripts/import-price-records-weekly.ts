/**
 * Imports the weekly store prices from the files at the repo root
 * (user, 2026-11-16), after import-catalogue-weekly.ts created the catalogue
 * and its 2025/2026 SRPs:
 *
 *   PRICE-RECORD-2025-3-STORES-WEEKLY.xlsx   Jan–Dec 2025, 4 weeks a month (columns D–AY)
 *   PRICE-RECORD-2026-3-STORES-WEEKLY.xlsx   Jan–Aug 2026, 4 weeks a month (columns D–AI)
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/import-price-records-weekly.ts [--apply | --undo]
 *
 * Without a flag this is a dry run: it reads both files, reports what it would
 * write, and writes nothing.
 *
 * One price record per store × catalogue item × week. The week columns are
 * days 1–7, 8–14, 15–21 and 22–last day of the month; each record covers its
 * week as a range, stored the app's way (calendar dates at 00:00 UTC):
 * dateAndTime = first day, periodEnd = last day. Status is what the app would
 * compute from the SRP in force on the start date (above → OVERPRICE, below →
 * UNDERPRICE, equal or no SRP → COMPLIANT). Records are owned by the demo officer.
 *
 * Sheets map to stores by name; "ACC STORE" is ACC HYPERMART (user-confirmed).
 * Rows map to the catalogue by sheet row (SRP.xlsx row − 11, as in
 * import-catalogue-weekly.ts), checked against the item name and unit. Blank
 * cells are skipped. Prices under half or over double the item's median at
 * that store for the year are listed (typo guard); SKIP_OUTLIERS decides
 * whether they are also skipped — off for these files.
 *
 * Every created id is written to MANIFEST_PATH before the transaction; --undo
 * deletes exactly those records.
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

const ROOT = join(__dirname, '..', '..');
const FILES = [
  { year: 2025, file: join(ROOT, 'PRICE-RECORD-2025-3-STORES-WEEKLY.xlsx'), months: 12 },
  { year: 2026, file: join(ROOT, 'PRICE-RECORD-2026-3-STORES-WEEKLY.xlsx'), months: 8 },
];
const FIRST_WEEK_COLUMN = 4; // D
const WEEK_STARTS = [1, 8, 15, 22];
const ROW_OFFSET = 11;
const SHEET_TO_STORE: Record<string, string> = { 'ACC STORE': 'ACC HYPERMART' };
const OFFICER_EMAIL = 'officer@presyoserbisyo.gov.ph';
const MANIFEST_PATH = join(__dirname, '.imported-price-records-weekly.json');
const TX_OPTIONS = { maxWait: 20_000, timeout: 600_000 };
const CHUNK = 5_000;
// The 96 outliers in these files (4 items, one month each, every store, both
// years) look planted in the simulated data; the user chose to import them
// (2026-11-16). They are still listed, just not skipped.
const SKIP_OUTLIERS = false;

type Status = 'COMPLIANT' | 'OVERPRICE' | 'UNDERPRICE';
type NewRecord = {
  id: string;
  commodityId: string;
  storeId: string;
  userId: string;
  price: number;
  dateAndTime: Date;
  periodEnd: Date;
  status: Status;
};

const text = (cell: ExcelJS.Cell): string => {
  let v: unknown = cell.value;
  if (v && typeof v === 'object') {
    const o = v as { result?: unknown; text?: unknown; richText?: { text: string }[] };
    v = o.result ?? o.text ?? (o.richText ? o.richText.map((t) => t.text).join('') : null);
  }
  return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim();
};
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const storeKey = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const utcDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

/** Same rule as price-record.repository's calculatePriceStatus. */
function statusFor(price: number, srp: number | undefined): Status {
  if (srp === undefined) return 'COMPLIANT';
  if (price > srp) return 'OVERPRICE';
  if (price < srp) return 'UNDERPRICE';
  return 'COMPLIANT';
}

async function plan() {
  const [stores, officer, commodities, srps, existing] = await Promise.all([
    prisma.store.findMany({ select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { email: OFFICER_EMAIL }, select: { id: true } }),
    prisma.commodity.findMany({ select: { id: true, name: true } }),
    prisma.sRP.findMany({ select: { commodityId: true, price: true, effectiveDate: true }, orderBy: { effectiveDate: 'asc' } }),
    prisma.priceRecord.count(),
  ]);
  if (!officer) throw new Error(`No user ${OFFICER_EMAIL}.`);
  if (existing > 0) throw new Error(`${existing} price records already exist — this import expects none.`);
  const storeByKey = new Map(stores.map((s) => [storeKey(s.name), s]));
  const commodityByName = new Map(commodities.map((c) => [c.name, c.id]));
  const srpsByCommodity = new Map<string, { price: number; from: Date }[]>();
  for (const s of srps) {
    const list = srpsByCommodity.get(s.commodityId) ?? [];
    list.push({ price: Number(s.price), from: s.effectiveDate });
    srpsByCommodity.set(s.commodityId, list);
  }
  const srpOn = (commodityId: string, date: Date) => {
    let found: number | undefined;
    for (const s of srpsByCommodity.get(commodityId) ?? []) if (s.from <= date) found = s.price;
    return found;
  };

  const records: NewRecord[] = [];
  const typos: string[] = [];
  const perSheet: string[] = [];
  let blanks = 0;

  for (const { year, file, months } of FILES) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    for (const ws of wb.worksheets) {
      const storeName = SHEET_TO_STORE[ws.name] ?? ws.name;
      const store = storeByKey.get(storeKey(storeName));
      if (!store) throw new Error(`${year} sheet "${ws.name}": no store "${storeName}".`);
      const label = text(ws.getRow(2).getCell(1));
      if (!label.toUpperCase().includes(ws.name.toUpperCase())) throw new Error(`${year} sheet "${ws.name}": row 2 reads "${label}".`);

      // Week header check: row 7 must read 1-7, 8-14, 15-21, 22-<last day> per month.
      for (let m = 0; m < months; m++) {
        for (let w = 0; w < 4; w++) {
          const col = FIRST_WEEK_COLUMN + m * 4 + w;
          const end = w < 3 ? WEEK_STARTS[w] + 6 : new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
          const want = `${WEEK_STARTS[w]}-${end}`;
          const got = text(ws.getRow(7).getCell(col));
          if (got !== want) throw new Error(`${year} "${ws.name}" column ${col}: header "${got}", expected "${want}".`);
        }
      }

      let count = 0;
      for (const item of SRP_XLSX_ITEMS) {
        const r = item.row - ROW_OFFSET;
        const row = ws.getRow(r);
        const name = text(row.getCell(1));
        const unit = text(row.getCell(2));
        if (!norm(item.name).startsWith(norm(name)) || !norm(item.name).includes(norm(unit))) {
          throw new Error(`${year} "${ws.name}" row ${r} is "${name} | ${unit}", expected ${item.name}.`);
        }
        const commodityId = commodityByName.get(item.name);
        if (!commodityId) throw new Error(`Commodity "${item.name}" is not in the database.`);

        const cells: { m: number; w: number; price: number }[] = [];
        for (let m = 0; m < months; m++) {
          for (let w = 0; w < 4; w++) {
            const raw = text(row.getCell(FIRST_WEEK_COLUMN + m * 4 + w));
            if (raw === '') { blanks++; continue; }
            const price = Number(raw);
            if (!(price > 0)) throw new Error(`${year} "${ws.name}" row ${r}: bad price "${raw}".`);
            cells.push({ m, w, price: Math.round(price * 100) / 100 });
          }
        }
        const mid = cells.length ? median(cells.map((c) => c.price)) : 0;
        for (const { m, w, price } of cells) {
          if (price < mid / 2 || price > mid * 2) {
            typos.push(`${year} ${ws.name} r${r} ${item.name} month ${m + 1} week ${w + 1}: ₱${price} (median ₱${mid})`);
            if (SKIP_OUTLIERS) continue;
          }
          const start = utcDate(year, m, WEEK_STARTS[w]);
          const end = w < 3 ? utcDate(year, m, WEEK_STARTS[w] + 6) : utcDate(year, m + 1, 0);
          records.push({
            id: randomUUID(),
            commodityId,
            storeId: store.id,
            userId: officer.id,
            price,
            dateAndTime: start,
            periodEnd: end,
            status: statusFor(price, srpOn(commodityId, start)),
          });
          count++;
        }
      }
      perSheet.push(`${year} ${ws.name} → ${store.name}: ${count} records`);
    }
  }
  return { records, typos, perSheet, blanks };
}

async function apply(dryRun: boolean) {
  const { records, typos, perSheet, blanks } = await plan();
  for (const line of perSheet) console.log(line);
  console.log(`Blank cells skipped: ${blanks}`);
  console.log(`Outliers (${typos.length}, ${SKIP_OUTLIERS ? "skipped" : "imported"})`);
  for (const t of typos) console.log(`  ${t}`);
  const by = (y: number, s: Status) => records.filter((r) => r.dateAndTime.getUTCFullYear() === y && r.status === s).length;
  for (const y of [2025, 2026]) {
    console.log(`${y}: OVERPRICE ${by(y, 'OVERPRICE')} · UNDERPRICE ${by(y, 'UNDERPRICE')} · COMPLIANT ${by(y, 'COMPLIANT')}`);
  }
  console.log(`Would create ${records.length} price records.`);
  const sample = records.filter((r) => r.price && r.dateAndTime.getUTCMonth() === 0).slice(0, 1).concat(
    records.filter((r) => r.dateAndTime.getUTCFullYear() === 2026 && r.dateAndTime.getUTCMonth() === 1 && r.dateAndTime.getUTCDate() === 22).slice(0, 1));
  for (const s of sample) console.log('Sample:', s.dateAndTime.toISOString().slice(0, 10), '→', s.periodEnd.toISOString().slice(0, 10), `₱${s.price}`, s.status);

  if (dryRun) {
    console.log('\n[dry run] nothing written. Re-run with --apply to create.');
    return;
  }
  if (existsSync(MANIFEST_PATH)) {
    const m = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as { status: string };
    if (m.status === 'applied') throw new Error(`An applied manifest already exists at ${MANIFEST_PATH}.`);
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify({
    appliedAt: new Date().toISOString(),
    status: 'applied',
    recordIds: records.map((r) => r.id),
    skippedTypos: typos,
  }), 'utf8');

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < records.length; i += CHUNK) {
      await tx.priceRecord.createMany({ data: records.slice(i, i + CHUNK) });
      console.log(`  inserted ${Math.min(i + CHUNK, records.length)} / ${records.length}`);
    }
  }, TX_OPTIONS);

  const total = await prisma.priceRecord.count();
  console.log(`\nDone. Price records now: ${total}`);
  if (total !== records.length) throw new Error('Post-apply count does not match the plan — investigate.');
}

async function undo() {
  if (!existsSync(MANIFEST_PATH)) throw new Error(`No manifest at ${MANIFEST_PATH}.`);
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as { status: string; recordIds: string[] };
  if (manifest.status !== 'applied') throw new Error(`Manifest status is "${manifest.status}" — nothing to undo.`);
  let deleted = 0;
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < manifest.recordIds.length; i += CHUNK) {
      deleted += (await tx.priceRecord.deleteMany({ where: { id: { in: manifest.recordIds.slice(i, i + CHUNK) } } })).count;
    }
  }, TX_OPTIONS);
  writeFileSync(MANIFEST_PATH, JSON.stringify({ ...manifest, status: 'undone' }), 'utf8');
  console.log(`Undone: ${deleted} records deleted. Price records now: ${await prisma.priceRecord.count()}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--undo')) await undo();
  else await apply(!args.includes('--apply'));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
