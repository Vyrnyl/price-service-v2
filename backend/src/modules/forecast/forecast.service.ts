import { prisma } from '../../prisma';
import AppError from '../../shared/utils/AppError';
import { forecastRepository } from './forecast.repository';
import { forecastArima } from './arima';
import type { CreateForecastInput, UpdateForecastInput, GenerateForecastInput } from './forecast.schema';

function toDecimal(value: number) {
  return Number(value.toFixed(4));
}

function calculateConfidence(series: number[], horizon: number, index: number): number {
  const values = series.filter((value) => Number.isFinite(value) && value > 0);

  if (values.length < 3) {
    return 0.2;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const volatility = Math.sqrt(variance) / Math.max(mean, 1);
  const dataSupport = Math.min(0.25, values.length / 100);
  const horizonPenalty = Math.min(0.15, (index + 1) * 0.03);
  const stabilityScore = Math.max(0.2, 0.9 - volatility * 1.2 - horizonPenalty + dataSupport);

  return Number(Math.min(0.99, Math.max(0.2, stabilityScore)).toFixed(2));
}

export function buildForecastItems({
  commodityId,
  predictedPrices,
  baseDate,
  series,
  horizon,
}: {
  commodityId: string;
  predictedPrices: number[];
  baseDate: Date;
  series: number[];
  horizon: number;
}): CreateForecastInput[] {
  return predictedPrices.map((predictedPrice, index) => ({
    commodityId,
    predictedPrice: toDecimal(predictedPrice),
    confidence: calculateConfidence(series, horizon, index),
    forecastDate: new Date(baseDate.getTime() + (index + 1) * 24 * 60 * 60 * 1000),
  }));
}

export const forecastService = {
  createForecast: (data: CreateForecastInput) => forecastRepository.create(data),
  getForecasts: () => forecastRepository.findAll(),
  getForecastById: (id: string) => forecastRepository.findById(id),
  getForecastsByCommodityId: (commodityId: string) => forecastRepository.findByCommodityId(commodityId),
  updateForecast: (id: string, data: UpdateForecastInput) => forecastRepository.update(id, data),
  deleteForecast: (id: string) => forecastRepository.delete(id),

  generateForecast: async ({ commodityId, horizon }: GenerateForecastInput) => {
    const priceRecords = await prisma.priceRecord.findMany({
      where: { commodityId },
      select: { price: true, dateAndTime: true },
      orderBy: { dateAndTime: 'asc' },
    });

    if (priceRecords.length < 3) {
      throw new AppError('At least 3 historical price records are required for forecasting', 400);
    }

    const series = priceRecords.map((record) => Number(record.price));
    const predictedValues = forecastArima(series, horizon);
    const baseDate = priceRecords[priceRecords.length - 1]?.dateAndTime ?? new Date();

    const forecastItems = buildForecastItems({
      commodityId,
      predictedPrices: predictedValues,
      baseDate,
      series,
      horizon,
    });

    await prisma.forecast.deleteMany({ where: { commodityId } });
    await forecastRepository.createMany(forecastItems);
    console.log('deleted old forecasts and created new forecasts for commodityId:', commodityId);
    return forecastRepository.findByCommodityId(commodityId);
  },
};
