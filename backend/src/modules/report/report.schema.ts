import { z } from 'zod';

const reportTypeEnum = z.enum(['MONTHLY', 'SRP_COMPLIANCE', 'TREND']);
export type ReportTypeEnum = z.infer<typeof reportTypeEnum>;
const reportFormatEnum = z.enum(['PDF', 'EXCEL']);

export const createReportSchema = z.object({
  type: reportTypeEnum,
  period: z.string().min(1, 'Period is required'),
  format: reportFormatEnum,
  commodityGroup: z.string().optional(),
  storeId: z.string().uuid('Invalid store ID').optional(),
});

export const updateReportSchema = z.object({
  type: reportTypeEnum.optional(),
  period: z.string().min(1, 'Period is required').optional(),
  format: reportFormatEnum.optional(),
  commodityGroup: z.string().optional(),
  storeId: z.string().uuid('Invalid store ID').optional(),
});

export const reportIdParamSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReportFormat = z.infer<typeof reportFormatEnum>;
