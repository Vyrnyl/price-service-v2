/**
 * Creates the commodity catalogue and its 2025 + 2026 SRPs from the weekly
 * store-price files (user, 2026-11-16), after clear-commodities.ts emptied
 * commodities, SRPs, price records and forecasts:
 *
 *   PRICE-RECORD-2025-3-STORES-WEEKLY.xlsx   column C "SRP (2025)"
 *   PRICE-RECORD-2026-3-STORES-WEEKLY.xlsx   column C "SRP (2026)"
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/import-catalogue-weekly.ts [--apply | --undo]
 *
 * Without a flag this is a dry run: it reads and checks both files and writes nothing.
 *
 * The files are the same DTI Price and Supply Monitoring Form as SRP.xlsx,
 * with every item row 11 rows higher. So the catalogue is the one already
 * transcribed in prisma/srp-xlsx-catalogue.ts (529 items, same names,
 * categories and skip rules: DELISTED, Visayas/Mindanao/NCR rows, repeats).
 * Each catalogue item is matched to file row (row - 11) and refused unless that
 * row's item text and unit agree with the name. Column C must be identical on
 * all three store sheets of a file.
 *
 * SRPs: "SRP (2025)" takes effect 2025-01-01 with a 2025-12-31 end label;
 * "SRP (2026)" takes effect 2026-01-01 with no end. Dates are stored as
 * YYYY-MM-DDT00:00:00.000Z like every SRP. "NO SRP" → no SRP row.
 *
 * Categories are matched by name to the existing 16; nothing else is touched.
 * The created ids go to MANIFEST_PATH; --undo deletes exactly those rows and
 * refuses while any price record or forecast points at them.
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { SRP_XLSX_CATEGORIES, SRP_XLSX_ITEMS } from '../prisma/srp-xlsx-catalogue';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ROOT = join(__dirname, '..', '..');
const FILES = {
  2025: join(ROOT, 'PRICE-RECORD-2025-3-STORES-WEEKLY.xlsx'),
  2026: join(ROOT, 'PRICE-RECORD-2026-3-STORES-WEEKLY.xlsx'),
} as const;
const ROW_OFFSET = 11; // SRP.xlsx row → weekly file row
const SRP_DATES = {
  2025: { effectiveDate: new Date('2025-01-01T00:00:00.000Z'), effectiveEndDate: new Date('2025-12-31T00:00:00.000Z') },
  2026: { effectiveDate: new Date('2026-01-01T00:00:00.000Z'), effectiveEndDate: null },
} as const;
const MANIFEST_PATH = join(__dirname, '.imported-catalogue-weekly.json');
const TX_OPTIONS = { maxWait: 20_000, timeout: 180_000 };

type Year = keyof typeof FILES;
type Row = { name: string; unit: string; srp: string };

const text = (cell: ExcelJS.Cell): string => {
  let v: unknown = cell.value;
  if (v && typeof v === 'object') {
    const o = v as { result?: unknown; text?: unknown; richText?: { text: string }[] };
    v = o.result ?? o.text ?? (o.richText ? o.richText.map((t) => t.text).join('') : null);
  }
  return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim();
};

/** Column A–C of every row, checked identical across the file's store sheets. */
async function readSrpColumn(year: Year): Promise<Map<number, Row>> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILES[year]);
  const header = text(wb.worksheets[0].getRow(7).getCell(3));
  if (header !== `SRP (${year})`) throw new Error(`${FILES[year]}: column C header is "${header}", expected "SRP (${year})"`);

  const sheets = wb.worksheets.map((ws) => {
    const rows = new Map<number, Row>();
    for (let r = 8; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      rows.set(r, { name: text(row.getCell(1)), unit: text(row.getCell(2)), srp: text(row.getCell(3)) });
    }
    return { name: ws.name, rows };
  });
  const [first, ...rest] = sheets;
  for (const sheet of rest) {
    for (const [r, a] of first.rows) {
      const b = sheet.rows.get(r);
      if (!b || a.name !== b.name || a.unit !== b.unit || a.srp !== b.srp) {
        throw new Error(`${year}: row ${r} differs between "${first.name}" and "${sheet.name}"`);
      }
    }
  }
  console.log(`${year}: sheets ${sheets.map((s) => s.name).join(', ')} — columns A–C identical`);
  return first.rows;
}

function parseSrp(value: string, where: string): number | null {
  if (value === 'NO SRP') return null;
  const n = Number(value);
  if (!(n > 0) || Math.abs(Math.round(n * 100) - n * 100) > 1e-6) throw new Error(`Bad SRP "${value}" at ${where}`);
  return n;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

async function plan() {
  const files = { 2025: await readSrpColumn(2025), 2026: await readSrpColumn(2026) };

  const categories = await prisma.category.findMany();
  const categoryId = new Map(categories.map((c) => [c.name, c.id]));
  for (const name of SRP_XLSX_CATEGORIES) {
    if (!categoryId.has(name)) throw new Error(`Category "${name}" is not in the database`);
  }

  const used = new Set<number>();
  const commodities: { id: string; name: string; status: string; categoryId: string }[] = [];
  const srps: { id: string; commodityId: string; price: number; effectiveDate: Date; effectiveEndDate: Date | null }[] = [];
  let mismatchedOld = 0;

  for (const item of SRP_XLSX_ITEMS) {
    const r = item.row - ROW_OFFSET;
    used.add(r);
    const id = randomUUID();
    commodities.push({ id, name: item.name, status: 'Active', categoryId: categoryId.get(item.category)! });

    for (const year of [2025, 2026] as const) {
      const row = files[year].get(r);
      if (!row) throw new Error(`${year}: no row ${r} for ${item.name}`);
      const name = norm(item.name);
      if (!name.startsWith(norm(row.name)) || !name.includes(norm(row.unit))) {
        throw new Error(`${year}: row ${r} is "${row.name} | ${row.unit}", expected ${item.name}`);
      }
      const price = parseSrp(row.srp, `${year} row ${r}`);
      if (year === 2025 && price !== item.srp) mismatchedOld++;
      if (price !== null) srps.push({ id: randomUUID(), commodityId: id, price, ...SRP_DATES[year] });
    }
  }

  // Every item row the catalogue leaves out, so the skips can be checked by eye.
  const skipped: string[] = [];
  for (const [r, row] of files[2025]) {
    if (used.has(r) || !row.unit || row.unit === row.name) continue; // blank or section heading
    skipped.push(`r${r} ${row.name} ${row.unit} [${row.srp}]`);
  }

  return { commodities, srps, skipped, mismatchedOld };
}

async function counts() {
  const [categories, commodities, srps, priceRecords, forecasts] = await Promise.all([
    prisma.category.count(),
    prisma.commodity.count(),
    prisma.sRP.count(),
    prisma.priceRecord.count(),
    prisma.forecast.count(),
  ]);
  return { categories, commodities, srps, priceRecords, forecasts };
}

async function apply(dryRun: boolean) {
  const before = await counts();
  console.log('Current rows:', before);
  if (before.commodities > 0 || before.srps > 0) {
    throw new Error('Commodities or SRPs already exist — this import expects an empty catalogue.');
  }

  const { commodities, srps, skipped, mismatchedOld } = await plan();
  const s25 = srps.filter((s) => s.effectiveDate.getUTCFullYear() === 2025);
  const s26 = srps.filter((s) => s.effectiveDate.getUTCFullYear() === 2026);
  console.log(`\nItem rows left out (${skipped.length}):`);
  for (const line of skipped) console.log(`  ${line}`);
  console.log(`\n2025 SRPs differing from the previous import's SRPs: ${mismatchedOld}`);
  console.log(`\nWould create: ${commodities.length} commodities · ${s25.length} SRPs effective 2025-01-01 (end 2025-12-31) · ` +
    `${s26.length} SRPs effective 2026-01-01 · ${commodities.length - new Set(srps.map((s) => s.commodityId)).size} commodities without an SRP`);
  const sample = commodities.find((c) => c.name === 'ABSOLUTE PURE Distilled Drinking Water 350ml');
  if (sample) console.log('Sample:', sample.name, srps.filter((s) => s.commodityId === sample.id).map((s) => `${s.price} from ${s.effectiveDate.toISOString().slice(0, 10)}`));

  if (dryRun) {
    console.log('\n[dry run] nothing written. Re-run with --apply to create.');
    return;
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify({
    createdAt: new Date().toISOString(),
    commodityIds: commodities.map((c) => c.id),
    srpIds: srps.map((s) => s.id),
  }, null, 2), 'utf8');

  await prisma.$transaction(async (tx) => {
    await tx.commodity.createMany({ data: commodities });
    await tx.sRP.createMany({ data: srps });
  }, TX_OPTIONS);

  const after = await counts();
  console.log('\nDone. Rows now:', after);
  if (after.commodities !== commodities.length || after.srps !== srps.length) {
    throw new Error('Post-apply counts do not match the plan — investigate.');
  }
}

async function undo() {
  if (!existsSync(MANIFEST_PATH)) throw new Error(`No manifest at ${MANIFEST_PATH}.`);
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as { commodityIds: string[]; srpIds: string[] };
  const refs = await prisma.priceRecord.count({ where: { commodityId: { in: manifest.commodityIds } } })
    + await prisma.forecast.count({ where: { commodityId: { in: manifest.commodityIds } } });
  if (refs > 0) throw new Error(`${refs} price records/forecasts point at these commodities — remove them first.`);
  await prisma.$transaction(async (tx) => {
    await tx.sRP.deleteMany({ where: { commodityId: { in: manifest.commodityIds } } });
    await tx.commodity.deleteMany({ where: { id: { in: manifest.commodityIds } } });
  }, TX_OPTIONS);
  console.log('Undone. Rows now:', await counts());
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
