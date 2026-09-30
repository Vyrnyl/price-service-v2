/**
 * Adds earlier SRPs to the five commodities that sort first by name, so the
 * SRP history pop-up has a real series to show.
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/seed-srp-history.ts            # dry run
 *   npx tsx --import ./node_modules/dotenv/config scripts/seed-srp-history.ts --apply
 *   npx tsx --import ./node_modules/dotenv/config scripts/seed-srp-history.ts --undo
 *
 * THIS WRITES TO THE LIVE DATABASE (there is no separate dev DB). Without a
 * flag it is a dry run and writes nothing.
 *
 * Only inserts — no existing SRP or price record is modified. Every new SRP is
 * dated before the commodity's earliest existing SRP *and* its earliest price
 * record, and the run aborts if that does not hold: price-record status and the
 * report generator resolve "the SRP in effect on the record's date", so an SRP
 * dated inside the recorded period would change how existing records are judged.
 *
 * Row ids are generated here and written to `scripts/.seeded-srp-history.json`
 * *before* the insert, so the manifest can never miss a row. `--undo` deletes
 * exactly those ids and nothing else.
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { SRP_HISTORY_SAMPLE_NAMES, buildEarlierSrps } from '../prisma/srp-history-sample';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const MANIFEST_PATH = join(__dirname, '.seeded-srp-history.json');

type Manifest = {
  status: 'pending' | 'applied' | 'undone';
  seededAt: string;
  undoneAt?: string;
  ids: string[];
};

function readManifest(): Manifest | null {
  return existsSync(MANIFEST_PATH) ? (JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest) : null;
}

function writeManifest(manifest: Manifest) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

const day = (date: Date) => date.toISOString().slice(0, 10);

async function undo() {
  const manifest = readManifest();
  if (!manifest || manifest.ids.length === 0) {
    console.log(`No manifest at ${MANIFEST_PATH} — nothing recorded as seeded, so nothing to delete.`);
    return;
  }

  const result = await prisma.sRP.deleteMany({ where: { id: { in: manifest.ids } } });
  const remaining = await prisma.sRP.count({ where: { id: { in: manifest.ids } } });
  if (remaining > 0) {
    throw new Error(`${remaining} seeded SRPs still present after delete — manifest kept for retry.`);
  }

  writeManifest({ ...manifest, status: 'undone', undoneAt: new Date().toISOString() });
  console.log(`Deleted ${result.count} seeded SRPs. Manifest kept as an audit trail (status: undone).`);
}

async function seed(apply: boolean) {
  const existing = readManifest();
  if (existing && existing.status !== 'undone') {
    const present = await prisma.sRP.count({ where: { id: { in: existing.ids } } });
    if (present > 0) {
      throw new Error(`${present} SRPs from a previous run are still present. Run --undo first; refusing to seed twice.`);
    }
  }

  const rows: { id: string; commodityId: string; price: number; effectiveDate: Date }[] = [];

  for (const name of SRP_HISTORY_SAMPLE_NAMES) {
    const matches = await prisma.commodity.findMany({
      where: { name },
      select: {
        id: true,
        srps: { orderBy: [{ effectiveDate: 'asc' }, { createdAt: 'desc' }], select: { price: true, effectiveDate: true } },
      },
    });
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one commodity named "${name}", found ${matches.length}.`);
    }

    const commodity = matches[0];
    const earliestSrp = commodity.srps[0];
    if (!earliestSrp) {
      throw new Error(`"${name}" has no SRP to build history back from.`);
    }

    const firstRecord = await prisma.priceRecord.aggregate({
      where: { commodityId: commodity.id },
      _min: { dateAndTime: true },
    });
    const earliestRecord = firstRecord._min.dateAndTime;
    const before =
      earliestRecord && earliestRecord < earliestSrp.effectiveDate ? earliestRecord : earliestSrp.effectiveDate;

    const steps = buildEarlierSrps(name, Number(earliestSrp.price), before);
    for (const step of steps) {
      if (step.effectiveDate >= before) {
        throw new Error(`Generated SRP for "${name}" on ${day(step.effectiveDate)} is not before ${day(before)}.`);
      }
    }

    console.log(`\n${name}`);
    console.log(
      `  existing: earliest SRP ₱${Number(earliestSrp.price).toFixed(2)} on ${day(earliestSrp.effectiveDate)}, ` +
        `earliest price record ${earliestRecord ? day(earliestRecord) : 'none'}`,
    );
    for (const step of steps) {
      console.log(`  + ₱${step.price.toFixed(2).padStart(8)}  effective ${day(step.effectiveDate)}`);
      rows.push({ id: randomUUID(), commodityId: commodity.id, ...step });
    }
  }

  console.log(`\n${rows.length} SRPs to insert across ${SRP_HISTORY_SAMPLE_NAMES.length} commodities.`);

  if (!apply) {
    console.log('Dry run — nothing written. Re-run with --apply to insert.');
    return;
  }

  // Manifest first, so a crash after the insert can never leave rows unrecorded.
  writeManifest({ status: 'pending', seededAt: new Date().toISOString(), ids: rows.map((row) => row.id) });
  const result = await prisma.sRP.createMany({ data: rows });
  writeManifest({ status: 'applied', seededAt: new Date().toISOString(), ids: rows.map((row) => row.id) });
  console.log(`Inserted ${result.count} SRPs. Ids recorded in ${MANIFEST_PATH}.`);
}

async function main() {
  if (process.argv.includes('--undo')) {
    await undo();
  } else {
    await seed(process.argv.includes('--apply'));
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
