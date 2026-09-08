import AppError from '../../shared/utils/AppError';
import { commodityRepository } from './commodity.repository';
import type { CreateCommodityInput, ListCommoditiesQuery, UpdateCommodityInput } from './commodity.schema';

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
};
