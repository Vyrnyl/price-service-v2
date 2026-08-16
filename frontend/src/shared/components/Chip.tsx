import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export default function Chip({ active = false, className = "", children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-label-caps font-medium transition-colors ${
        active
          ? "border-transparent bg-primary-container text-on-primary-container"
          : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
      } ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
