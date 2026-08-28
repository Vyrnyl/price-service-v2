import { Request, Response } from 'express';
import { auditLogService } from './audit-log.service';
import { listAuditLogsQuerySchema } from './audit-log.schema';

export const auditLogController = {
  getAuditLogs: async (req: Request, res: Response) => {
    const query = listAuditLogsQuerySchema.parse(req.query);
    const { data, total, page, pageSize } = await auditLogService.getAuditLogs(query);

    res.json({ status: 'success', data, total, page, pageSize });
  },
};
