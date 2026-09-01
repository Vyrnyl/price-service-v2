import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/schema/pagination.schema';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const createStoreSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  lastVisited: z.coerce.date().optional().nullable(),
});

export const updateStoreSchema = createStoreSchema.partial();

export const storeIdParamSchema = z.object({
  id: z.string().uuid('Invalid store ID'),
});

const storeStatusEnum = z.enum(['Monitored', 'Pending']);

export const listStoresQuerySchema = paginationQuerySchema.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  municipality: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  status: z.preprocess(emptyToUndefined, storeStatusEnum.optional()),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type ListStoresQuery = z.infer<typeof listStoresQuerySchema>;
