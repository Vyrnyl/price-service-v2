import {
  MdCheckCircle,
  MdDownload,
  MdFactCheck,
  MdHourglassEmpty,
  MdPictureAsPdf,
  MdStorefront,
  MdSync,
  MdTableView,
  MdWarning,
} from "react-icons/md";
import type { ExportFormat, RecentReport, ReportType } from "../types/report.types";

export const reportTypes: ReportType[] = [
  {
    id: "daily-compliance",
    backendType: "SRP_COMPLIANCE",
    title: "Daily Compliance",
    description: "Status of SRP compliance per retailer.",
    icon: MdFactCheck,
    iconBg: "bg-primary-container/10",
    iconColor: "text-primary",
    metaStyle: "bg-primary/5 text-primary",
  },
  {
    id: "store-monitoring",
    backendType: "MONTHLY",
    title: "Store Monitoring",
    description: "Aggregated store performance summary.",
    icon: MdStorefront,
    iconBg: "bg-secondary-container/10",
    iconColor: "text-secondary",
  },
  {
    id: "commodity-price",
    backendType: "TREND",
    title: "Commodity Price",
    description: "List of commodity historical records.",
    icon: MdWarning,
    iconBg: "bg-error-container/20",
    iconColor: "text-error",
  },
];

export const exportFormats: ExportFormat[] = [
  {
    label: "Adobe PDF",
    icon: MdPictureAsPdf,
    iconClass: "text-error",
  },
  {
    label: "Excel Spreadsheet",
    icon: MdTableView,
    iconClass: "",
  },
];

export const recentReports: RecentReport[] = [
  {
    id: "report-1",
    name: "Daily_Compliance_2024-05-15",
    meta: "May 15, 2024 • 2.4 MB",
    status: "Ready",
    statusClass: "bg-secondary-fixed text-on-secondary-fixed",
    statusIcon: MdCheckCircle,
    buttonLabel: "Download PDF",
    buttonIcon: MdDownload,
    buttonClass:
      "border border-primary text-primary hover:bg-primary-container hover:text-on-primary-container",
  },
  {
    id: "report-2",
    name: "Price_Trend_Weekly_Q2",
    meta: "Generating now...",
    status: "Processing",
    statusClass: "bg-surface-container-lowest text-on-surface-variant",
    statusIcon: MdSync,
    buttonLabel: "Please Wait",
    buttonIcon: MdHourglassEmpty,
    buttonClass: "border border-outline-variant text-outline cursor-not-allowed",
    disabled: true,
  },
  {
    id: "report-3",
    name: "Store_Log_Virac_Center",
    meta: "May 14, 2024 • 12 KB",
    status: "Ready",
    statusClass: "bg-secondary-fixed text-on-secondary-fixed",
    statusIcon: MdCheckCircle,
    buttonLabel: "Download Excel",
    buttonIcon: MdDownload,
    buttonClass:
      "border border-primary text-primary hover:bg-primary-container hover:text-on-primary-container",
  },
];
