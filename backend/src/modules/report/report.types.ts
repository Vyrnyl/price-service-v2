import type { CreateReportInput } from './report.schema';

export type CreateReportWithFileInput = CreateReportInput & {
  filename: string;
  contentType: string;
  fileContent: Buffer;
  filterLabel: string | null;
};
