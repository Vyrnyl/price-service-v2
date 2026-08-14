import { reportRepository } from './report.repository';
import type { UpdateReportInput } from './report.schema';
import type { CreateReportWithFileInput } from './report.types';
import type { AuthUser } from '../../shared/types/express';

export const reportService = {
  createReport: (data: CreateReportWithFileInput, userId: string) => reportRepository.create(data, userId),
  getReports: (authUser?: AuthUser) => reportRepository.findAll(authUser),
  getReportById: (id: string) => reportRepository.findById(id),
  getReportFile: (id: string) => reportRepository.findFileById(id),
  updateReport: (id: string, data: UpdateReportInput) => reportRepository.update(id, data),
  deleteReport: (id: string) => reportRepository.delete(id),
  deleteAllReports: (authUser?: AuthUser) => reportRepository.deleteAll(authUser),
};
