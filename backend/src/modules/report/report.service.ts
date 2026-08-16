import { reportRepository } from './report.repository';
import type { UpdateReportInput } from './report.schema';
import type { CreateReportWithFileInput } from './report.types';
import type { AuthUser } from '../../shared/types/express';
import type { PaginationQuery } from '../../shared/schema/pagination.schema';

export const reportService = {
  createReport: (data: CreateReportWithFileInput, userId: string) => reportRepository.create(data, userId),
  getReports: (authUser: AuthUser | undefined, query: PaginationQuery) => reportRepository.findAll(authUser, query),
  getReportById: (id: string, authUser?: AuthUser) => reportRepository.findById(id, authUser),
  getReportFile: (id: string, authUser?: AuthUser) => reportRepository.findFileById(id, authUser),
  updateReport: (id: string, data: UpdateReportInput, authUser?: AuthUser) =>
    reportRepository.update(id, data, authUser),
  deleteReport: (id: string, authUser?: AuthUser) => reportRepository.delete(id, authUser),
  deleteAllReports: (authUser?: AuthUser) => reportRepository.deleteAll(authUser),
};
