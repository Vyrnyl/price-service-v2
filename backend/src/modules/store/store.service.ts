import { storeRepository } from './store.repository';
import type { CreateStoreInput, UpdateStoreInput } from './store.schema';
import type { AuthUser } from '../../shared/types/express';

export const storeService = {
  createStore: (data: CreateStoreInput, userId: string) =>
    storeRepository.create(data, userId),
  getStores: (user?: AuthUser) => {
    if (user?.role === 'OFFICER') {
      return storeRepository.findAll(user.userId);
    }

    if (user?.role === 'ADMIN') {
      return storeRepository.findAll();
    }

    return Promise.resolve([]);
  },
  getStoreById: (id: string) => storeRepository.findById(id),
  updateStore: (id: string, data: UpdateStoreInput) => storeRepository.update(id, data),
  deleteStore: (id: string) => storeRepository.delete(id),
};
