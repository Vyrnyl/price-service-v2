import { Request, Response } from 'express';
import AppError from '../../shared/utils/AppError';
import { reportService } from './report.service';
import { createReportSchema, updateReportSchema, reportIdParamSchema } from './report.schema';
import { generateReportFile } from './report.generator';
import type { CreateReportWithFileInput } from './report.types';
import type { AuthUser } from '../../shared/types/express';

export const reportController = {
  createReport: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;

    if (!authUser) {
      throw new AppError('Unauthorized', 401);
    }

    const validatedBody = createReportSchema.parse(req.body);
    const generated = await generateReportFile(validatedBody);

    const reportPayload: CreateReportWithFileInput = {
      ...validatedBody,
      filename: generated.filename,
      contentType: generated.contentType,
      fileContent: generated.fileContent,
    };

    const report = await reportService.createReport(reportPayload, authUser.userId);

    res.status(201).json({ status: 'success', data: report });
  },

  getReports: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    const reports = await reportService.getReports(authUser);

    res.json({ status: 'success', data: reports });
  },

  getReportById: async (req: Request, res: Response) => {
    const { id } = reportIdParamSchema.parse(req.params);
    const report = await reportService.getReportById(id);

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    res.json({ status: 'success', data: report });
  },

  downloadReport: async (req: Request, res: Response) => {
    const { id } = reportIdParamSchema.parse(req.params);
    const file = await reportService.getReportFile(id);

    if (!file) {
      throw new AppError('Report not found', 404);
    }

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(Buffer.from(file.fileContent));
  },

  updateReport: async (req: Request, res: Response) => {
    const { id } = reportIdParamSchema.parse(req.params);
    const validatedBody = updateReportSchema.parse(req.body);
    const report = await reportService.updateReport(id, validatedBody);

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    res.json({ status: 'success', data: report });
  },

  deleteReport: async (req: Request, res: Response) => {
    const { id } = reportIdParamSchema.parse(req.params);

    await reportService.deleteReport(id);

    res.status(204).send();
  },

  deleteAllReports: async (req: Request, res: Response) => {
    const authUser = req.user as AuthUser | undefined;
    await reportService.deleteAllReports(authUser);

    res.status(204).send();
  },
};
