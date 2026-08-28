import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError = false, icon, className = "", ...rest },
  ref,
) {
  const field = (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={`w-full rounded-lg border bg-surface py-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
        icon ? "pl-11 pr-4" : "px-4"
      } ${
        hasError ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant"
      } ${className}`.trim()}
      {...rest}
    />
  );

  if (!icon) return field;

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
      >
        {icon}
      </span>
      {field}
    </div>
  );
});

export default Input;
