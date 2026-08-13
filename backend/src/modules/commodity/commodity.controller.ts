import { Request, Response } from 'express';
import AppError from '../../utils/AppError';
import { commodityService } from './commodity.service';
import { createCommoditySchema, updateCommoditySchema, commodityIdParamSchema } from './commodity.schema';

export const commodityController = {
  createCommodity: async (req: Request, res: Response) => {
    const validated = createCommoditySchema.parse(req.body);
    const commodity = await commodityService.createCommodity(validated);

    res.status(201).json({ status: 'success', data: commodity });
  },

  getCommodities: async (_req: Request, res: Response) => {
    const commodities = await commodityService.getCommodities();

    res.json({ status: 'success', data: commodities });
  },

  getCommodityById: async (req: Request, res: Response) => {
    const { id } = commodityIdParamSchema.parse(req.params);
    const commodity = await commodityService.getCommodityById(id);

    if (!commodity) {
      throw new AppError('Commodity not found', 404);
    }

    res.json({ status: 'success', data: commodity });
  },

  updateCommodity: async (req: Request, res: Response) => {
    const { id } = commodityIdParamSchema.parse(req.params);
    const data = updateCommoditySchema.parse(req.body);

    const updatedCommodity = await commodityService.updateCommodity(id, data);

    res.json({ status: 'success', data: updatedCommodity });
  },

  deleteCommodity: async (req: Request, res: Response) => {
    const { id } = commodityIdParamSchema.parse(req.params);

    await commodityService.deleteCommodity(id);

    res.status(204).send();
  },
};
