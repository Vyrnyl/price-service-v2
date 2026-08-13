import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { priceRecordService, type CreatePriceRecordWithUserInput } from './price-record.service';
import { createPriceRecordSchema, updatePriceRecordSchema, priceRecordIdParamSchema } from './price-record.schema';
import type { AuthUser } from '../../shared/types/express';

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
    const priceRecords = await priceRecordService.getPriceRecords(authUser);

    res.json({ status: 'success', data: priceRecords });
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
    const { id } = priceRecordIdParamSchema.parse(req.params);

    await priceRecordService.deletePriceRecord(id);

    res.status(204).send();
  },
};
