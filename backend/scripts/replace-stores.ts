/**
 * Replaces the store registry with the three real DTI-monitored stores and
 * redistributes every existing price record across them.
 *
 *   npx tsx --import ./node_modules/dotenv/config scripts/replace-stores.ts [--apply]
 *
 * Without --apply this is a dry run: it reports exactly what would change and
 * writes nothing.
 *
 * Why a redistribute rather than a delete: PriceRecord.storeId is nullable
 * with `onDelete: SetNull`, so deleting the old stores would leave every
 * record orphaned (storeId = null) instead of failing loudly. The rows would
 * survive, but per-store price ranges and Store Compliance — both of which
 * read the store relation — would silently go blank. Reassigning first means
 * nothing is orphaned at any point.
 *
 * The three target stores are matched/created by name. Records are spread
 * deterministically (by record id hash) so a re-run does not reshuffle them.
 */

import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TARGET_STORES = [
  { name: 'ARDCIMART', location: 'Virac, Catanduanes' },
  { name: 'ACC HYPERMART', location: 'Virac, Catanduanes' },
  { name: 'VIRAC LUCKY SUPERMART', location: 'Virac, Catanduanes' },
];

const BACKUP_PATH = join(__dirname, '.store-replacement-backup.json');

/** Stable bucket for a record id, so re-running keeps the same assignment. */
function bucketFor(id: string, buckets: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) % 1000003;
  }
  return h % buckets;
}

async function main() {
  const apply = process.argv.includes('--apply');

  const existingStores = await prisma.store.findMany({ orderBy: { name: 'asc' } });
  const records = await prisma.priceRecord.findMany({ select: { id: true, storeId: true } });

  console.log(`Existing stores: ${existingStores.length}`);
  for (const s of existingStores) {
    const n = records.filter((r) => r.storeId === s.id).length;
    console.log(`  ${s.name.padEnd(24)} ${String(n).padStart(5)} records`);
  }
  console.log(`Total price records: ${records.length}`);

  // The officer who owns the store rows. Store.userId is required, so the new
  // rows need a real user; reuse whoever owns the current stores rather than
  // assuming a seeded email still exists.
  const ownerId =
    existingStores[0]?.userId ??
    (await prisma.user.findFirst({ where: { role: 'OFFICER' } }))?.id ??
    (await prisma.user.findFirst({}))?.id;

  if (!ownerId) throw new Error('No user found to own the store rows.');

  // Back up the current mapping BEFORE any write, so the reassignment can be
  // undone even though the old store rows themselves are removed.
  if (!apply) {
    console.log('\n[dry run] no changes written. Re-run with --apply to commit.');
  } else if (existsSync(BACKUP_PATH)) {
    console.log(`\nBackup already exists at ${BACKUP_PATH} — not overwriting it.`);
  } else {
    writeFileSync(
      BACKUP_PATH,
      JSON.stringify(
        {
          takenAt: new Date().toISOString(),
          stores: existingStores,
          assignments: records.map((r) => ({ id: r.id, storeId: r.storeId })),
        },
        null,
        2,
      ),
      'utf8',
    );
    console.log(`\nBacked up ${records.length} assignments + ${existingStores.length} stores to ${BACKUP_PATH}`);
  }

  // Resolve the three targets, reusing a row if one already carries the name.
  const targetIds: string[] = [];
  for (const spec of TARGET_STORES) {
    const found = existingStores.find((s) => s.name === spec.name);
    if (found) {
      targetIds.push(found.id);
      console.log(`Keep   ${spec.name} (already present)`);
      continue;
    }
    if (!apply) {
      targetIds.push(`<new:${spec.name}>`);
      console.log(`Create ${spec.name} — ${spec.location}`);
      continue;
    }
    const created = await prisma.store.create({
      data: { name: spec.name, location: spec.location, userId: ownerId },
    });
    targetIds.push(created.id);
    console.log(`Create ${spec.name} — ${spec.location}`);
  }

  // Spread the records deterministically across the three targets.
  const planned = records.map((r) => ({ id: r.id, target: bucketFor(r.id, TARGET_STORES.length) }));
  const counts = TARGET_STORES.map((_, i) => planned.filter((p) => p.target === i).length);
  console.log('\nPlanned distribution:');
  TARGET_STORES.forEach((s, i) => console.log(`  ${s.name.padEnd(24)} ${String(counts[i]).padStart(5)} records`));

  if (!apply) {
    const removed = existingStores.filter((s) => !TARGET_STORES.some((t) => t.name === s.name));
    console.log(`\nWould remove ${removed.length} store(s): ${removed.map((s) => s.name).join(', ')}`);
    await prisma.$disconnect();
    return;
  }

  // Reassign in bulk, one updateMany per target, before removing anything —
  // so no record is ever left pointing at a store that is about to vanish.
  for (let i = 0; i < targetIds.length; i += 1) {
    const ids = planned.filter((p) => p.target === i).map((p) => p.id);
    const CHUNK = 500;
    for (let c = 0; c < ids.length; c += CHUNK) {
      await prisma.priceRecord.updateMany({
        where: { id: { in: ids.slice(c, c + CHUNK) } },
        data: { storeId: targetIds[i] },
      });
    }
    console.log(`Reassigned ${ids.length} records -> ${TARGET_STORES[i].name}`);
  }

  const stale = existingStores.filter((s) => !TARGET_STORES.some((t) => t.name === s.name));
  for (const s of stale) {
    const left = await prisma.priceRecord.count({ where: { storeId: s.id } });
    if (left > 0) throw new Error(`Refusing to delete ${s.name}: ${left} records still reference it.`);
    await prisma.store.delete({ where: { id: s.id } });
    console.log(`Deleted ${s.name}`);
  }

  const orphans = await prisma.priceRecord.count({ where: { storeId: null } });
  console.log(`\nDone. Stores: ${await prisma.store.count()} | orphaned records: ${orphans}`);
  if (orphans > 0) throw new Error('Orphaned records detected — investigate before trusting the data.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
