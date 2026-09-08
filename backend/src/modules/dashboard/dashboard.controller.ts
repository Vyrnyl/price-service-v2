import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { storeViolationsQuerySchema } from './dashboard.schema';
import type { AuthUser } from '../../shared/types/express';

export const dashboardController = {
  getAnalytics: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const analytics = await dashboardService.getAnalytics(authUser);

    res.json({ status: 'success', data: analytics });
  },

  getStoreViolations: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const { startDate, endDate } = storeViolationsQuerySchema.parse(req.query);
    const violations = await dashboardService.getStoreViolations(authUser, { startDate, endDate });

    res.json({ status: 'success', data: violations });
  },
};
