import { reportRepository } from './report.repository';
import type { CreateReportInput, UpdateReportInput } from './report.schema';
import type { AuthUser } from '../../shared/types/express';

export const reportService = {
  createReport: (data: CreateReportInput, userId: string) => reportRepository.create(data, userId),
  getReports: (authUser?: AuthUser) => reportRepository.findAll(authUser),
  getReportById: (id: string) => reportRepository.findById(id),
  updateReport: (id: string, data: UpdateReportInput) => reportRepository.update(id, data),
  deleteReport: (id: string) => reportRepository.delete(id),
  deleteAllReports: (authUser?: AuthUser) => reportRepository.deleteAll(authUser),
};
