import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "primary" | "secondary" | "error" | "success" | "warning" | "info" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: "bg-primary-fixed text-on-primary-fixed",
  secondary: "bg-secondary-fixed text-on-secondary-fixed",
  error: "bg-error-container text-on-error-container",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  info: "bg-info-container text-on-info-container",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

export default function Badge({ variant = "neutral", className = "", children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-sans text-label-caps ${VARIANT_CLASSES[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}
