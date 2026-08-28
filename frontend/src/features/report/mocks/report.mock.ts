import {
  MdFactCheck,
  MdPictureAsPdf,
  MdStorefront,
  MdTableView,
  MdWarning,
} from "react-icons/md";
import type { ExportFormat, ReportType } from "../types/report.types";

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
