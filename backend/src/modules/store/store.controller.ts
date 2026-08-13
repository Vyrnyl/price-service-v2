import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { storeService } from './store.service';
import { createStoreSchema, updateStoreSchema, storeIdParamSchema } from './store.schema';
import type { AuthUser } from '../../shared/types/express';

export const storeController = {
  createStore: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;

    if (!authUser) {
      throw new AppError('Unauthorized', 401);
    }

    const validatedBody = createStoreSchema.parse(req.body);
    const store = await storeService.createStore(validatedBody, authUser.userId);

    res.status(201).json({ status: 'success', data: store });
  },

  getStores: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const stores = await storeService.getStores(authUser);

    res.json({ status: 'success', data: stores });
  },

  getStoreById: async (req: Request, res: Response) => {
    const { id } = storeIdParamSchema.parse(req.params);
    const store = await storeService.getStoreById(id);

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    res.json({ status: 'success', data: store });
  },

  updateStore: async (req: Request, res: Response) => {
    const { id } = storeIdParamSchema.parse(req.params);
    const validatedBody = updateStoreSchema.parse(req.body);
    const store = await storeService.updateStore(id, validatedBody);

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    res.json({ status: 'success', data: store });
  },

  deleteStore: async (req: Request, res: Response) => {
    const { id } = storeIdParamSchema.parse(req.params);

    await storeService.deleteStore(id);

    res.status(204).send();
  },
};
