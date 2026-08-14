import { Request, Response } from 'express';
import { auditLogService } from './audit-log.service';

export const auditLogController = {
  getAuditLogs: async (_req: Request, res: Response) => {
    const entries = await auditLogService.getAuditLogs();

    res.json({ status: 'success', data: entries });
  },
};
