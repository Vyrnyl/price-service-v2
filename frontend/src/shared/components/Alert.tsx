import type { HTMLAttributes, ReactNode } from "react";

type AlertVariant = "error" | "neutral";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: "border-error/30 bg-error-container text-on-error-container",
  neutral: "border-outline-variant bg-surface-container-high text-on-surface-variant",
};

export default function Alert({ variant = "neutral", className = "", children, ...rest }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 text-body-sm ${VARIANT_CLASSES[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
