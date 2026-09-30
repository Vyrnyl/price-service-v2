import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { forecastService } from '../forecast';
import { publicRepository } from './public.repository';
import { publicCommodityIdParamSchema } from './public.schema';
import {
  buildPublicCommoditiesPayload,
  buildPublicStatsDto,
  buildSrpHistoryDto,
  resolveHistoryWindowStart,
  resolveUpdatesCutoff,
} from './public.service';

export const publicController = {
  getPublicForecastByCommodityId: async (req: Request, res: Response) => {
    const { commodityId } = req.params;

    try {
      const forecasts = await forecastService.generateForecast({ commodityId, horizon: 7 });
      res.json({ status: 'success', data: forecasts });
    } catch (error) {
      if (error instanceof AppError) {
        res.json({ status: 'success', data: [] });
        return;
      }

      throw error;
    }
  },

  getPublicCommodities: async (_req: Request, res: Response) => {
    const commodities = await publicRepository.findCommoditiesForPublic(resolveHistoryWindowStart());
    const payload = buildPublicCommoditiesPayload(commodities);

    res.json({ status: 'success', data: payload });
  },

  getPublicSrpHistory: async (req: Request, res: Response) => {
    const { id } = publicCommodityIdParamSchema.parse(req.params);
    const commodity = await publicRepository.findCommodityWithSrpHistory(id);

    if (!commodity) {
      throw new AppError('Commodity not found', 404);
    }

    res.json({ status: 'success', data: buildSrpHistoryDto(commodity) });
  },

  getPublicStats: async (_req: Request, res: Response) => {
    const [monitoredStoreCount, updatesToday] = await Promise.all([
      publicRepository.countMonitoredStores(),
      publicRepository.countPriceUpdatesSince(resolveUpdatesCutoff()),
    ]);

    res.json({ status: 'success', data: buildPublicStatsDto(monitoredStoreCount, updatesToday) });
  },
};
