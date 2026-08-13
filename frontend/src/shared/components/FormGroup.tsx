import type { ReactNode } from "react";
import { FieldError } from "./FieldError";

interface FormGroupProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

export default function FormGroup({ label, htmlFor, error, children }: FormGroupProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-body-sm font-medium text-on-surface" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}
