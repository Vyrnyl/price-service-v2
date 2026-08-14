import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import type { AuthUser } from '../../shared/types/express';

export const dashboardController = {
  getAnalytics: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const analytics = await dashboardService.getAnalytics(authUser);

    res.json({ status: 'success', data: analytics });
  },
};
