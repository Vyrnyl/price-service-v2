/**
 * Restores the original price/status values captured by
 * `normalize-price-trends-demo.ts` — including the pre-existing records that
 * predate the demo seeding.
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/restore-price-trends-backup.ts
 */

import { existsSync, readFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BACKUP_PATH = join(__dirname, '.price-trends-backup.json');

type BackupRecord = {
  id: string;
  commodityName: string;
  price: number;
  status: 'COMPLIANT' | 'OVERPRICE' | 'UNDERPRICE';
};

async function main() {
  if (!existsSync(BACKUP_PATH)) {
    console.log(`No backup at ${BACKUP_PATH} — nothing to restore.`);
    return;
  }

  const backup = JSON.parse(readFileSync(BACKUP_PATH, 'utf8')) as {
    backedUpAt: string;
    count: number;
    records: BackupRecord[];
  };

  console.log(`Backup holds ${backup.records.length} records from ${backup.backedUpAt}.`);

  // Some rows may have been deleted since the backup (e.g. by the unseed
  // script). Restore only what still exists rather than failing the whole run.
  const existingIds = new Set(
    (
      await prisma.priceRecord.findMany({
        where: { id: { in: backup.records.map((record) => record.id) } },
        select: { id: true },
      })
    ).map((row) => row.id),
  );

  const restorable = backup.records.filter((record) => existingIds.has(record.id));
  const missing = backup.records.length - restorable.length;
  if (missing > 0) {
    console.log(`${missing} of them no longer exist and will be skipped.`);
  }

  const CHUNK = 50;
  for (let start = 0; start < restorable.length; start += CHUNK) {
    const chunk = restorable.slice(start, start + CHUNK);
    await prisma.$transaction(
      chunk.map((record) =>
        prisma.priceRecord.update({
          where: { id: record.id },
          data: { price: record.price, status: record.status },
        }),
      ),
    );
  }

  console.log(`Restored ${restorable.length} records to their original values.`);

  renameSync(BACKUP_PATH, `${BACKUP_PATH}.restored`);
  console.log('Backup archived as .price-trends-backup.json.restored');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
