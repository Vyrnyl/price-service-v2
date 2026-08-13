import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { forecastService } from './forecast.service';
import { createForecastSchema, updateForecastSchema, forecastIdParamSchema, generateForecastSchema } from './forecast.schema';

export const forecastController = {
  createForecast: async (req: Request, res: Response) => {
    const validatedBody = createForecastSchema.parse(req.body);
    const forecast = await forecastService.createForecast(validatedBody);

    res.status(201).json({ status: 'success', data: forecast });
  },
  
  generateForecast: async (req: Request, res: Response) => {
    const validatedBody = generateForecastSchema.parse(req.body);
    const forecasts = await forecastService.generateForecast(validatedBody);

    res.status(201).json({ status: 'success', data: forecasts });
  },
  
  getForecasts: async (_req: Request, res: Response) => {
    const forecasts = await forecastService.getForecasts();

    res.json({ status: 'success', data: forecasts });
  },

  getForecastById: async (req: Request, res: Response) => {
    const { id } = forecastIdParamSchema.parse(req.params);
    const forecast = await forecastService.getForecastById(id);

    if (!forecast) {
      throw new AppError('Forecast not found', 404);
    }

    res.json({ status: 'success', data: forecast });
  },

  updateForecast: async (req: Request, res: Response) => {
    const { id } = forecastIdParamSchema.parse(req.params);
    const validatedBody = updateForecastSchema.parse(req.body);
    const forecast = await forecastService.updateForecast(id, validatedBody);

    if (!forecast) {
      throw new AppError('Forecast not found', 404);
    }

    res.json({ status: 'success', data: forecast });
  },

  deleteForecast: async (req: Request, res: Response) => {
    const { id } = forecastIdParamSchema.parse(req.params);

    await forecastService.deleteForecast(id);

    res.status(204).send();
  },
};
