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
    description: "Store compliance rates, plus a list of above-SRP violations only.",
    detail:
      "Prints a compliance-rate table per store, then itemises only the records priced above SRP — compliant and below-SRP records are counted, not listed line by line.",
    icon: MdFactCheck,
    iconBg: "bg-primary-container/10",
    iconColor: "text-primary",
    metaStyle: "bg-primary/5 text-primary",
  },
  {
    id: "store-monitoring",
    backendType: "MONTHLY",
    title: "Store Monitoring",
    description: "Every price record in range, grouped by commodity with subtotals.",
    detail:
      "Prints the full list of individual price records for the period — grouped by commodity, with a subtotal (average price, compliance split) per group.",
    icon: MdStorefront,
    iconBg: "bg-secondary-container/10",
    iconColor: "text-secondary",
  },
  {
    id: "commodity-price",
    backendType: "TREND",
    title: "Commodity Price",
    description: "Weekly average price trend per commodity — no individual records.",
    detail:
      "Prints only weekly average prices per commodity and how they moved across the period — it does not list individual price records.",
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
