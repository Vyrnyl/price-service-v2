import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/schema/pagination.schema';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const auditActionEnum = z.enum([
  'LOGIN',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
  'SRP_CREATE',
  'SRP_UPDATE',
  'PRICE_RECORD_DELETE',
]);

export const listAuditLogsQuerySchema = paginationQuerySchema.extend({
  action: z.preprocess(emptyToUndefined, auditActionEnum.optional()),
  dateFrom: z.preprocess(emptyToUndefined, z.string().date().optional()),
  dateTo: z.preprocess(emptyToUndefined, z.string().date().optional()),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
