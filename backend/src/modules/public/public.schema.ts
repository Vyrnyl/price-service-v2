import { z } from 'zod';

export const publicCommodityIdParamSchema = z.object({
  id: z.string().uuid('Invalid commodity ID'),
});
