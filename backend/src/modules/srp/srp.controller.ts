import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { srpService } from './srp.service';
import { createSrpSchema, updateSrpSchema, srpIdParamSchema } from './srp.schema';
import { auditLogService } from '../audit-log';
import type { AuthUser } from '../../shared/types/express';

export const srpController = {
  createSrp: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const validatedBody = createSrpSchema.parse(req.body);
    const srp = await srpService.createSrp(validatedBody);

    if (authUser) {
      await auditLogService.record({
        actorId: authUser.userId,
        action: 'SRP_CREATE',
        targetId: srp.id,
        metadata: { commodity: srp.commodity.name, price: srp.price.toString() },
      });
    }

    res.status(201).json({ status: 'success', data: srp });
  },

  getSrps: async (_req: Request, res: Response) => {
    const srps = await srpService.getSrps();

    res.json({ status: 'success', data: srps });
  },

  getSrpById: async (req: Request, res: Response) => {
    const { id } = srpIdParamSchema.parse(req.params);
    const srp = await srpService.getSrpById(id);

    if (!srp) {
      throw new AppError('SRP not found', 404);
    }

    res.json({ status: 'success', data: srp });
  },

  updateSrp: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const { id } = srpIdParamSchema.parse(req.params);
    const validatedBody = updateSrpSchema.parse(req.body);
    const srp = await srpService.updateSrp(id, validatedBody);

    if (!srp) {
      throw new AppError('SRP not found', 404);
    }

    if (authUser) {
      await auditLogService.record({
        actorId: authUser.userId,
        action: 'SRP_UPDATE',
        targetId: srp.id,
        metadata: { commodity: srp.commodity.name, price: srp.price.toString() },
      });
    }

    res.json({ status: 'success', data: srp });
  },

  deleteSrp: async (req: Request, res: Response) => {
    const { id } = srpIdParamSchema.parse(req.params);

    await srpService.deleteSrp(id);

    res.status(204).send();
  },
};
