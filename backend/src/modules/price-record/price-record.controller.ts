import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { priceRecordService } from './price-record.service';
import {
  createPriceRecordSchema,
  updatePriceRecordSchema,
  priceRecordIdParamSchema,
  listPriceRecordsQuerySchema,
} from './price-record.schema';
import { auditLogService } from '../audit-log';
import type { AuthUser } from '../../shared/types/express';
import type { CreatePriceRecordWithUserInput } from './price-record.types';

export const priceRecordController = {
  createPriceRecord: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;

    if (!authUser) {
      throw new AppError('Unauthorized', 401);
    }

    const validatedBody = createPriceRecordSchema.parse(req.body);
    const payload: CreatePriceRecordWithUserInput = {
      ...validatedBody,
      userId: authUser.userId,
    };
    const priceRecord = await priceRecordService.createPriceRecord(payload);

    res.status(201).json({ status: 'success', data: priceRecord });
  },

  getPriceRecords: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const query = listPriceRecordsQuerySchema.parse(req.query);
    const { data, total, page, pageSize } = await priceRecordService.getPriceRecords(authUser, query);

    res.json({ status: 'success', data, total, page, pageSize });
  },

  getPriceRecordById: async (req: Request, res: Response) => {
    const { id } = priceRecordIdParamSchema.parse(req.params);
    const priceRecord = await priceRecordService.getPriceRecordById(id);

    if (!priceRecord) {
      throw new AppError('Price record not found', 404);
    }

    res.json({ status: 'success', data: priceRecord });
  },

  updatePriceRecord: async (req: Request, res: Response) => {
    const { id } = priceRecordIdParamSchema.parse(req.params);
    const validatedBody = updatePriceRecordSchema.parse(req.body);
    const priceRecord = await priceRecordService.updatePriceRecord(id, validatedBody);

    if (!priceRecord) {
      throw new AppError('Price record not found', 404);
    }

    res.json({ status: 'success', data: priceRecord });
  },

  deletePriceRecord: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const { id } = priceRecordIdParamSchema.parse(req.params);

    const existingRecord = await priceRecordService.getPriceRecordById(id);

    if (!existingRecord) {
      throw new AppError('Price record not found', 404);
    }

    await priceRecordService.deletePriceRecord(id);

    if (authUser) {
      await auditLogService.record({
        actorId: authUser.userId,
        action: 'PRICE_RECORD_DELETE',
        targetId: id,
        metadata: {
          commodity: existingRecord.commodity.name,
          store: existingRecord.store?.name ?? 'Unknown store',
          price: existingRecord.price.toString(),
        },
      });
    }

    res.status(204).send();
  },
};
