import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/schema/pagination.schema';
import {
  SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD,
  getMaxSrpEffectiveDateString,
  isSrpEffectiveDateWithinWindow,
} from '../../shared/utils/srp-effective-date';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const commodityStatusEnum = z.enum(['Active', 'Inactive']);
export type CommodityStatus = z.infer<typeof commodityStatusEnum>;

const baseCommoditySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  status: commodityStatusEnum,
  categoryId: z.string().uuid('Select a category'),
});

export const createCommoditySchema = baseCommoditySchema
  .extend({
    srpPrice: z.coerce.number().positive('Price must be greater than 0').optional(),
    srpEffectiveDate: z.coerce.date().optional(),
  })
  .refine((data) => (data.srpPrice === undefined) === (data.srpEffectiveDate === undefined), {
    message: 'Provide both SRP price and effective date, or neither',
    path: ['srpEffectiveDate'],
  })
  .refine(
    (data) => data.srpEffectiveDate === undefined || isSrpEffectiveDateWithinWindow(data.srpEffectiveDate),
    {
      error: () =>
        `Effective date cannot be more than ${SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD} days ahead (latest: ${getMaxSrpEffectiveDateString()})`,
      path: ['srpEffectiveDate'],
    },
  );

export const updateCommoditySchema = baseCommoditySchema.partial();

export const commodityIdParamSchema = z.object({
  id: z.string().uuid('Invalid commodity ID'),
});

export const listCommoditiesQuerySchema = paginationQuerySchema.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  status: z.preprocess(emptyToUndefined, commodityStatusEnum.optional()),
});

export type CreateCommodityInput = z.infer<typeof createCommoditySchema>;
export type UpdateCommodityInput = z.infer<typeof updateCommoditySchema>;
export type ListCommoditiesQuery = z.infer<typeof listCommoditiesQuerySchema>;
