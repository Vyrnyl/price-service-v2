import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const storeViolationsQuerySchema = z.object({
  startDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  endDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
});

export type StoreViolationsQuery = z.infer<typeof storeViolationsQuerySchema>;
