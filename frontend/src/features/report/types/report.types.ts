import type { ComponentType } from "react";

export type ReportTypeEnum = "MONTHLY" | "SRP_COMPLIANCE" | "TREND";

export type ReportType = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  backendType: ReportTypeEnum;
  iconBg: string;
  iconColor: string;
  meta?: string;
  metaStyle?: string;
};

export type ExportFormat = {
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  iconClass: string;
};

export type RecentReport = {
  id: string;
  name: string;
  meta: string;
  status: string;
  statusClass: string;
  statusIcon: ComponentType<{ size?: number }>;
  buttonLabel: string;
  buttonIcon: ComponentType<{ size?: number }>;
  buttonClass: string;
  disabled?: boolean;
  fileUrl?: string;
};

export type BackendReportUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type BackendReport = {
  id: string;
  type: ReportTypeEnum;
  period: string;
  fileUrl: string;
  createdAt: string;
  user: BackendReportUser;
};

export type CreateReportPayload = {
  type: ReportTypeEnum;
  period: string;
  format: 'PDF' | 'EXCEL';
  commodityGroup?: string;
  storeId?: string;
};
