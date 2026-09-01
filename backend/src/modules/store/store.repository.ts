import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { CreateStoreInput, ListStoresQuery, UpdateStoreInput } from './store.schema';
import type { StoreScope } from './store.scope';
import { toSkipTake } from '../../shared/schema/pagination.schema';

// Mirrors the threshold in frontend/src/features/stores/utils/store-status.ts and use-stores.ts.
const PENDING_THRESHOLD_DAYS = 30;
const DAY_MS = 86400000;

function storeStatusCondition(label: 'Monitored' | 'Pending', monitoredCutoff: Date): Prisma.StoreWhereInput {
  return label === 'Monitored'
    ? { lastVisited: { gte: monitoredCutoff } }
    : { OR: [{ lastVisited: null }, { lastVisited: { lt: monitoredCutoff } }] };
}

export const storeRepository = {
  create: (data: CreateStoreInput, userId: string) =>
    prisma.store.create({
      data: { ...data, userId },
      include: { user: true },
    }),

  findAll: async (scope: Exclude<StoreScope, null>, query: ListStoresQuery) => {
    const { page, pageSize, search, municipality, status, quickFilter } = query;
    const { skip, take } = toSkipTake({ page, pageSize });

    const now = Date.now();
    const monitoredCutoff = new Date(now - PENDING_THRESHOLD_DAYS * DAY_MS);

    const conditions: Prisma.StoreWhereInput[] = [];

    if (scope.userId) {
      conditions.push({ userId: scope.userId });
    }
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    if (municipality) {
      conditions.push({ location: { contains: municipality, mode: 'insensitive' } });
    }
    if (status) {
      conditions.push(storeStatusCondition(status, monitoredCutoff));
    }
    if (quickFilter === 'Monitored' || quickFilter === 'Pending') {
      conditions.push(storeStatusCondition(quickFilter, monitoredCutoff));
    }

    const where: Prisma.StoreWhereInput = conditions.length ? { AND: conditions } : {};

    const [data, total] = await prisma.$transaction([
      prisma.store.findMany({ where, include: { user: true }, orderBy: { name: 'asc' }, skip, take }),
      prisma.store.count({ where }),
    ]);

    return { data, total, page, pageSize };
  },

  findById: (id: string) =>
    prisma.store.findUnique({ where: { id }, include: { user: true } }),

  update: (id: string, data: UpdateStoreInput) =>
    prisma.store.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.store.delete({ where: { id } }),
};
