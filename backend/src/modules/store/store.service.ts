import { storeRepository } from './store.repository';
import { resolveStoreScope } from './store.scope';
import type { CreateStoreInput, ListStoresQuery, UpdateStoreInput } from './store.schema';
import type { AuthUser } from '../../shared/types/express';

export const storeService = {
  createStore: (data: CreateStoreInput, userId: string) =>
    storeRepository.create(data, userId),
  getStores: (user: AuthUser | undefined, query: ListStoresQuery) => {
    const scope = resolveStoreScope(user);

    if (scope === null) {
      return Promise.resolve({ data: [], total: 0, page: query.page, pageSize: query.pageSize });
    }

    return storeRepository.findAll(scope, query);
  },
  getStoreById: (id: string) => storeRepository.findById(id),
  updateStore: (id: string, data: UpdateStoreInput) => storeRepository.update(id, data),
  deleteStore: (id: string) => storeRepository.delete(id),
};
