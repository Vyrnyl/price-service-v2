import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { hasError = false, className = "", children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={hasError || undefined}
      className={`w-full rounded-lg border bg-surface px-4 py-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
        hasError ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant"
      } ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  );
});

export default Select;
