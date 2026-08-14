import type { BadgeVariant } from "@/shared/components/Badge";
import type { AuditAction } from "../types/audit-log.types";

export const ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: "Login",
  USER_CREATE: "User Created",
  USER_UPDATE: "User Updated",
  USER_DELETE: "User Deleted",
  SRP_CREATE: "SRP Created",
  SRP_UPDATE: "SRP Updated",
  PRICE_RECORD_DELETE: "Price Record Deleted",
};

export const ACTION_BADGE_VARIANT: Record<AuditAction, BadgeVariant> = {
  LOGIN: "info",
  USER_CREATE: "success",
  USER_UPDATE: "primary",
  USER_DELETE: "error",
  SRP_CREATE: "success",
  SRP_UPDATE: "primary",
  PRICE_RECORD_DELETE: "error",
};

export const ACTION_FILTER_OPTIONS: Array<{ value: AuditAction | "ALL"; label: string }> = [
  { value: "ALL", label: "All Actions" },
  { value: "LOGIN", label: "Login" },
  { value: "USER_CREATE", label: "User Created" },
  { value: "USER_UPDATE", label: "User Updated" },
  { value: "USER_DELETE", label: "User Deleted" },
  { value: "SRP_CREATE", label: "SRP Created" },
  { value: "SRP_UPDATE", label: "SRP Updated" },
  { value: "PRICE_RECORD_DELETE", label: "Price Record Deleted" },
];
