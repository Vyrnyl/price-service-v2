import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import AppError from '../../shared/utils/AppError';
import { forecastService } from '../forecast';
import { buildPublicCommoditiesPayload } from './public.service';

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
    const commodities = await prisma.commodity.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        srps: {
          orderBy: [
            { effectiveDate: 'desc' },
            { createdAt: 'desc' },
          ],
          take: 1,
        },
        prices: {
          orderBy: [
            { dateAndTime: 'desc' },
            { createdAt: 'desc' },
          ],
          take: 8,
          include: {
            store: true,
          },
        },
      },
    });

    const payload = buildPublicCommoditiesPayload(commodities);

    res.json({ status: 'success', data: payload });
  },
};
