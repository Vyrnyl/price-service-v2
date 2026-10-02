import AppError from '../../shared/utils/AppError';
import { latestPerEffectiveDate } from '../../shared/utils/srp-revisions';
import { commodityRepository } from './commodity.repository';
import type { CreateCommodityInput, ListCommoditiesQuery, UpdateCommodityInput } from './commodity.schema';
import { buildSrpProjection } from './srp-projection';

async function assertNameAvailable(name: string, excludeId?: string) {
  const existing = await commodityRepository.findByNameCaseInsensitive(name);
  if (existing && existing.id !== excludeId) {
    throw new AppError(`A commodity named "${existing.name}" already exists`, 409);
  }
}

export const commodityService = {
  createCommodity: async (data: CreateCommodityInput) => {
    await assertNameAvailable(data.name);
    return commodityRepository.create(data);
  },
  getCommodities: (query: ListCommoditiesQuery) => commodityRepository.findAll(query),
  getCommodityById: (id: string) => commodityRepository.findById(id),
  updateCommodity: async (id: string, data: UpdateCommodityInput) => {
    if (data.name) {
      await assertNameAvailable(data.name, id);
    }
    return commodityRepository.update(id, data);
  },
  deleteCommodity: (id: string) => commodityRepository.delete(id),
  getSrpProjection: async (id: string, now: Date = new Date()) => {
    const commodity = await commodityRepository.findSrpRevisions(id);
    if (!commodity) {
      throw new AppError('Commodity not found', 404);
    }

    const revisions = latestPerEffectiveDate(commodity.srps).map((srp) => ({
      price: Number(srp.price),
      effectiveDate: srp.effectiveDate,
    }));

    return { commodityId: commodity.id, projection: buildSrpProjection(revisions, now) };
  },
};
