/**
 * Deletes exactly the price records created by `seed-price-trends-demo.ts`,
 * using the ids that script recorded — nothing is matched by date, price, or
 * commodity, so genuine officer entries cannot be caught by this.
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/unseed-price-trends-demo.ts
 */

import { existsSync, readFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SEEDED_IDS_PATH = join(__dirname, '.seeded-price-trends.json');

async function main() {
  if (!existsSync(SEEDED_IDS_PATH)) {
    console.log(`No manifest at ${SEEDED_IDS_PATH} — nothing recorded as seeded, so nothing to delete.`);
    return;
  }

  const manifest = JSON.parse(readFileSync(SEEDED_IDS_PATH, 'utf8')) as {
    seededAt: string;
    count: number;
    ids: string[];
  };

  console.log(`Manifest lists ${manifest.ids.length} records seeded at ${manifest.seededAt}.`);

  // Report what is actually still there before deleting, so a partial state is
  // visible rather than silently glossed over.
  const present = await prisma.priceRecord.count({ where: { id: { in: manifest.ids } } });
  console.log(`${present} of them still exist in the database.`);

  const result = await prisma.priceRecord.deleteMany({ where: { id: { in: manifest.ids } } });
  console.log(`Deleted ${result.count} price records.`);

  const remaining = await prisma.priceRecord.count({ where: { id: { in: manifest.ids } } });
  if (remaining !== 0) {
    throw new Error(`${remaining} seeded records still present after delete — manifest kept for retry.`);
  }

  // Keep the manifest as an audit trail rather than deleting it outright.
  renameSync(SEEDED_IDS_PATH, `${SEEDED_IDS_PATH}.removed`);
  console.log('All seeded records removed. Manifest archived as .seeded-price-trends.json.removed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
