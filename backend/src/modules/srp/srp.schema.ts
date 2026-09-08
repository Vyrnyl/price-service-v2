import { z } from 'zod';
import {
  SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD,
  getMaxSrpEffectiveDateString,
  isSrpEffectiveDateWithinWindow,
} from '../../shared/utils/srp-effective-date';

function effectiveDateWindowMessage() {
  return `Effective date cannot be more than ${SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD} days ahead (latest: ${getMaxSrpEffectiveDateString()})`;
}

export const createSrpSchema = z.object({
  commodityId: z.string().uuid('Invalid commodity ID'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  effectiveDate: z.coerce.date().refine(isSrpEffectiveDateWithinWindow, {
    error: effectiveDateWindowMessage,
  }),
});

export const updateSrpSchema = createSrpSchema.partial();

export const srpIdParamSchema = z.object({
  id: z.string().uuid('Invalid SRP ID'),
});

export type CreateSrpInput = z.infer<typeof createSrpSchema>;
export type UpdateSrpInput = z.infer<typeof updateSrpSchema>;
