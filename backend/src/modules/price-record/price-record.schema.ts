import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/schema/pagination.schema';

const priceStatusEnum = z.enum(['COMPLIANT', 'OVERPRICE', 'UNDERPRICE']);
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const createPriceRecordSchema = z.object({
  commodityId: z.string().uuid('Invalid commodity ID'),
  storeId: z.string().uuid('Invalid store ID'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  dateAndTime: z.coerce.date(),
  status: priceStatusEnum.optional(),
});

export const updatePriceRecordSchema = createPriceRecordSchema.partial();

export const priceRecordIdParamSchema = z.object({
  id: z.string().uuid('Invalid PriceRecord ID'),
});

export const listPriceRecordsQuerySchema = paginationQuerySchema.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  storeId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  commodityId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  status: z.preprocess(emptyToUndefined, priceStatusEnum.optional()),
});

export type CreatePriceRecordInput = z.infer<typeof createPriceRecordSchema>;
export type UpdatePriceRecordInput = z.infer<typeof updatePriceRecordSchema>;
export type ListPriceRecordsQuery = z.infer<typeof listPriceRecordsQuerySchema>;
