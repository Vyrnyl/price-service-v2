import { z } from 'zod';
import {
  SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD,
  getMaxSrpEffectiveDateString,
  isSrpEffectiveDateWithinWindow,
} from '../../shared/utils/srp-effective-date';

function effectiveDateWindowMessage() {
  return `Effective date cannot be more than ${SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD} days ahead (latest: ${getMaxSrpEffectiveDateString()})`;
}

// End of the SRP's date range — a label only; effectiveDate alone decides which
// SRP is in force. null or "" clears it. Checked before coercion because
// z.coerce.date() would turn null into 1970-01-01. No 7-day window: an end
// date naturally lies ahead.
const effectiveEndDateSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.union([z.null(), z.coerce.date()]).optional(),
);

const srpFields = z.object({
  commodityId: z.string().uuid('Invalid commodity ID'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  effectiveDate: z.coerce.date().refine(isSrpEffectiveDateWithinWindow, {
    error: effectiveDateWindowMessage,
  }),
  effectiveEndDate: effectiveEndDateSchema,
});

/** End before start is rejected; with only one side sent, the repository checks against the stored value. */
const endNotBeforeStart = (data: { effectiveDate?: Date; effectiveEndDate?: Date | null }) =>
  !data.effectiveDate || !data.effectiveEndDate || data.effectiveEndDate.getTime() >= data.effectiveDate.getTime();
const endBeforeStartIssue = { message: "End date can't be before the effective date", path: ['effectiveEndDate'] };

export const createSrpSchema = srpFields.refine(endNotBeforeStart, endBeforeStartIssue);

export const updateSrpSchema = srpFields.partial().refine(endNotBeforeStart, endBeforeStartIssue);

export const srpIdParamSchema = z.object({
  id: z.string().uuid('Invalid SRP ID'),
});

export type CreateSrpInput = z.infer<typeof createSrpSchema>;
export type UpdateSrpInput = z.infer<typeof updateSrpSchema>;
