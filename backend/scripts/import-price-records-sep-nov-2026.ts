/**
 * Adds the Sep 1 – Nov 7, 2026 weekly store prices (user, 2026-11-21) to the
 * Jan 2025 – Aug 2026 records from import-price-records-weekly.ts:
 *
 *   september-november_105218.xlsx   (repo root) — sheets ARDCIMART,
 *   VIRAC LUCKYSUPERMART, ACC STORE; columns D–L = Sep 1-7, 8-14, 15-21,
 *   22-30, Oct 1-7, 8-14, 15-21, 22-31, Nov 1-7.
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/import-price-records-sep-nov-2026.ts [--apply | --undo]
 *
 * Without a flag this is a dry run: it reads the file and the database,
 * reports what it would write, and writes nothing.
 *
 * Same rules as import-price-records-weekly.ts: one record per store ×
 * catalogue item × week, stored as a range (calendar dates at 00:00 UTC),
 * status from the SRP in force on the start date, owned by the demo officer.
 * Rows map to the catalogue by sheet row (SRP.xlsx row − 11 — this file has
 * the same rows as PRICE-RECORD-2026-3-STORES-WEEKLY.xlsx), checked against
 * the item name and unit. Unlike that script it adds to existing records: it
 * refuses to run if any record already starts on or after Sep 1, 2026.
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
const FILE = join(ROOT, 'september-november_105218.xlsx');
const YEAR = 2026;
const FIRST_NEW_DATE = new Date(Date.UTC(YEAR, 8, 1)); // Sep 1, 2026
// Column → week. Months are 0-based (8 = September).
const WEEKS = [
  { col: 4, month: 8, from: 1, to: 7, header: 'SEPTEMBER' },
  { col: 5, month: 8, from: 8, to: 14, header: 'SEPTEMBER' },
  { col: 6, month: 8, from: 15, to: 21, header: 'SEPTEMBER' },
  { col: 7, month: 8, from: 22, to: 30, header: 'SEPTEMBER' },
  { col: 8, month: 9, from: 1, to: 7, header: 'OCTOBER' },
  { col: 9, month: 9, from: 8, to: 14, header: 'OCTOBER' },
  { col: 10, month: 9, from: 15, to: 21, header: 'OCTOBER' },
  { col: 11, month: 9, from: 22, to: 31, header: 'OCTOBER' },
  { col: 12, month: 10, from: 1, to: 7, header: 'NOVEMBER' },
];
const ROW_OFFSET = 11;
const SHEET_TO_STORE: Record<string, string> = { 'ACC STORE': 'ACC HYPERMART' };
const OFFICER_EMAIL = 'officer@presyoserbisyo.gov.ph';
const MANIFEST_PATH = join(__dirname, '.imported-price-records-sep-nov-2026.json');
const TX_OPTIONS = { maxWait: 20_000, timeout: 600_000 };
const CHUNK = 5_000;

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
const utcDate = (m: number, d: number) => new Date(Date.UTC(YEAR, m, d));
const day = (d: Date) => d.toISOString().slice(0, 10);

/** Same rule as price-record.repository's calculatePriceStatus. */
function statusFor(price: number, srp: number | undefined): Status {
  if (srp === undefined) return 'COMPLIANT';
  if (price > srp) return 'OVERPRICE';
  if (price < srp) return 'UNDERPRICE';
  return 'COMPLIANT';
}

async function plan() {
  const [stores, officer, commodities, srps, overlapping, existingTotal] = await Promise.all([
    prisma.store.findMany({ select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { email: OFFICER_EMAIL }, select: { id: true } }),
    prisma.commodity.findMany({ select: { id: true, name: true } }),
    prisma.sRP.findMany({ select: { commodityId: true, price: true, effectiveDate: true }, orderBy: { effectiveDate: 'asc' } }),
    prisma.priceRecord.count({ where: { dateAndTime: { gte: FIRST_NEW_DATE } } }),
    prisma.priceRecord.count(),
  ]);
  if (!officer) throw new Error(`No user ${OFFICER_EMAIL}.`);
  if (overlapping > 0) {
    throw new Error(`${overlapping} price records already start on or after ${day(FIRST_NEW_DATE)} — this import expects none.`);
  }
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

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);
  if (wb.worksheets.length !== 3) throw new Error(`Expected 3 sheets, found ${wb.worksheets.length}.`);

  const records: NewRecord[] = [];
  const typos: string[] = [];
  const perSheet: string[] = [];
  let blanks = 0;

  for (const ws of wb.worksheets) {
    const storeName = SHEET_TO_STORE[ws.name] ?? ws.name;
    const store = storeByKey.get(storeKey(storeName));
    if (!store) throw new Error(`Sheet "${ws.name}": no store "${storeName}".`);
    const label = text(ws.getRow(2).getCell(1));
    if (!label.toUpperCase().includes(ws.name.toUpperCase())) throw new Error(`Sheet "${ws.name}": row 2 reads "${label}".`);
    const yearLabel = text(ws.getRow(4).getCell(1));
    if (!yearLabel.includes(`YEAR ${YEAR}`)) throw new Error(`Sheet "${ws.name}": row 4 reads "${yearLabel}".`);

    // Header check: row 6 = month, row 7 = "<from>-<to>".
    for (const w of WEEKS) {
      const month = text(ws.getRow(6).getCell(w.col));
      const range = text(ws.getRow(7).getCell(w.col));
      if (month !== w.header || range !== `${w.from}-${w.to}`) {
        throw new Error(`"${ws.name}" column ${w.col}: header "${month} ${range}", expected "${w.header} ${w.from}-${w.to}".`);
      }
    }
    if (text(ws.getRow(7).getCell(WEEKS.length + 4)) !== '') {
      throw new Error(`"${ws.name}": a column after the last expected week has a header — the file has more weeks than this script reads.`);
    }

    let count = 0;
    for (const item of SRP_XLSX_ITEMS) {
      const r = item.row - ROW_OFFSET;
      const row = ws.getRow(r);
      const name = text(row.getCell(1));
      const unit = text(row.getCell(2));
      if (!norm(item.name).startsWith(norm(name)) || !norm(item.name).includes(norm(unit))) {
        throw new Error(`"${ws.name}" row ${r} is "${name} | ${unit}", expected ${item.name}.`);
      }
      const commodityId = commodityByName.get(item.name);
      if (!commodityId) throw new Error(`Commodity "${item.name}" is not in the database.`);

      const cells: { week: (typeof WEEKS)[number]; price: number }[] = [];
      for (const week of WEEKS) {
        const raw = text(row.getCell(week.col));
        if (raw === '') { blanks++; continue; }
        const price = Number(raw);
        if (!(price > 0)) throw new Error(`"${ws.name}" row ${r}: bad price "${raw}".`);
        cells.push({ week, price: Math.round(price * 100) / 100 });
      }
      const mid = cells.length ? median(cells.map((c) => c.price)) : 0;
      for (const { week, price } of cells) {
        if (price < mid / 2 || price > mid * 2) {
          typos.push(`${ws.name} r${r} ${item.name} ${week.header} ${week.from}-${week.to}: ₱${price} (median ₱${mid})`);
        }
        const start = utcDate(week.month, week.from);
        records.push({
          id: randomUUID(),
          commodityId,
          storeId: store.id,
          userId: officer.id,
          price,
          dateAndTime: start,
          periodEnd: utcDate(week.month, week.to),
          status: statusFor(price, srpOn(commodityId, start)),
        });
        count++;
      }
    }
    perSheet.push(`${ws.name} → ${store.name}: ${count} records`);
  }

  // One record per store × commodity × start date.
  const keys = new Set(records.map((r) => `${r.storeId}|${r.commodityId}|${r.dateAndTime.getTime()}`));
  if (keys.size !== records.length) throw new Error(`Duplicate store × commodity × week in the plan (${records.length - keys.size}).`);

  return { records, typos, perSheet, blanks, existingTotal };
}

async function apply(dryRun: boolean) {
  const { records, typos, perSheet, blanks, existingTotal } = await plan();
  for (const line of perSheet) console.log(line);
  console.log(`Blank cells skipped: ${blanks}`);
  console.log(`Outliers (under half / over double the item's median in this file): ${typos.length}`);
  for (const t of typos) console.log(`  ${t}`);

  const count = (s: Status) => records.filter((r) => r.status === s).length;
  console.log(`Status: OVERPRICE ${count('OVERPRICE')} · UNDERPRICE ${count('UNDERPRICE')} · COMPLIANT ${count('COMPLIANT')}`);
  console.log('Per week:');
  for (const w of WEEKS) {
    const start = utcDate(w.month, w.from).getTime();
    const n = records.filter((r) => r.dateAndTime.getTime() === start).length;
    console.log(`  ${day(utcDate(w.month, w.from))} → ${day(utcDate(w.month, w.to))}: ${n}`);
  }
  for (const s of [records[0], records[records.length - 1]]) {
    console.log('Sample:', day(s.dateAndTime), '→', day(s.periodEnd), `₱${s.price}`, s.status);
  }
  console.log(`Would create ${records.length} price records (${existingTotal} → ${existingTotal + records.length}).`);

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
    outliers: typos,
  }), 'utf8');

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < records.length; i += CHUNK) {
      await tx.priceRecord.createMany({ data: records.slice(i, i + CHUNK) });
      console.log(`  inserted ${Math.min(i + CHUNK, records.length)} / ${records.length}`);
    }
  }, TX_OPTIONS);

  const total = await prisma.priceRecord.count();
  console.log(`\nDone. Price records now: ${total}`);
  if (total !== existingTotal + records.length) throw new Error('Post-apply count does not match the plan — investigate.');
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
