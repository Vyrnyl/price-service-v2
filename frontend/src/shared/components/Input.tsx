import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError = false, className = "", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={`w-full rounded-lg border bg-surface px-4 py-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
        hasError ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant"
      } ${className}`.trim()}
      {...rest}
    />
  );
});

export default Input;
