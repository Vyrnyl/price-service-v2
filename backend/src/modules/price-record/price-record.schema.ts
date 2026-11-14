import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/schema/pagination.schema';

const priceStatusEnum = z.enum(['COMPLIANT', 'OVERPRICE', 'UNDERPRICE']);
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

// End of the date range a price covers (dateAndTime is the start). null or ""
// clears it — the record goes back to a single date & time. Checked before
// coercion because z.coerce.date() would turn null into 1970-01-01.
const periodEndSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.union([z.null(), z.coerce.date()]).optional(),
);

const priceRecordFields = z.object({
  commodityId: z.string().uuid('Invalid commodity ID'),
  storeId: z.string().uuid('Invalid store ID'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  dateAndTime: z.coerce.date(),
  periodEnd: periodEndSchema,
  status: priceStatusEnum.optional(),
});

/** Range end before its start is rejected; with only one side sent, the repository checks against the stored value. */
const periodEndNotBeforeStart = (data: { dateAndTime?: Date; periodEnd?: Date | null }) =>
  !data.dateAndTime || !data.periodEnd || data.periodEnd.getTime() >= data.dateAndTime.getTime();
const periodEndIssue = { message: "End date can't be before the start date", path: ['periodEnd'] };

export const createPriceRecordSchema = priceRecordFields.refine(periodEndNotBeforeStart, periodEndIssue);

export const updatePriceRecordSchema = priceRecordFields.partial().refine(periodEndNotBeforeStart, periodEndIssue);

export const priceRecordIdParamSchema = z.object({
  id: z.string().uuid('Invalid PriceRecord ID'),
});

export const listPriceRecordsQuerySchema = paginationQuerySchema.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  storeId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  commodityId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  // Records whose commodity is in this category (Price Records' category filter).
  categoryId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  status: z.preprocess(emptyToUndefined, priceStatusEnum.optional()),
});

export type CreatePriceRecordInput = z.infer<typeof createPriceRecordSchema>;
export type UpdatePriceRecordInput = z.infer<typeof updatePriceRecordSchema>;
export type ListPriceRecordsQuery = z.infer<typeof listPriceRecordsQuerySchema>;
