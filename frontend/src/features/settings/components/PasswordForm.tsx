"use client";

import { type FormEvent } from "react";
import Card from "@/shared/components/Card";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import Alert from "@/shared/components/Alert";
import type { PasswordFormValues } from "../types/settings.types";

interface PasswordFormProps {
  values: PasswordFormValues;
  formErrors: Partial<Record<keyof PasswordFormValues, string>>;
  formError: string | null;
  submitLoading: boolean;
  onChange: (field: keyof PasswordFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function PasswordForm({
  values,
  formErrors,
  formError,
  submitLoading,
  onChange,
  onSubmit,
}: PasswordFormProps) {
  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-h3-desktop font-semibold text-on-surface">Change Password</h2>
      <p className="mt-1 text-body-sm text-on-surface-variant">
        Choose a new password. Your current password is required to confirm the change.
      </p>

      {formError ? (
        <Alert variant="error" className="mt-4">
          {formError}
        </Alert>
      ) : null}

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <FormGroup label="Current Password" htmlFor="current-password" error={formErrors.currentPassword}>
          <Input
            id="current-password"
            type="password"
            value={values.currentPassword}
            onChange={(event) => onChange("currentPassword", event.target.value)}
            hasError={Boolean(formErrors.currentPassword)}
            placeholder="••••••••"
          />
        </FormGroup>

        <div aria-hidden="true" className="hidden sm:block" />

        <FormGroup label="New Password" htmlFor="new-password" error={formErrors.newPassword}>
          <Input
            id="new-password"
            type="password"
            value={values.newPassword}
            onChange={(event) => onChange("newPassword", event.target.value)}
            hasError={Boolean(formErrors.newPassword)}
            placeholder="••••••••"
          />
        </FormGroup>

        <FormGroup
          label="Confirm New Password"
          htmlFor="confirm-new-password"
          error={formErrors.confirmNewPassword}
        >
          <Input
            id="confirm-new-password"
            type="password"
            value={values.confirmNewPassword}
            onChange={(event) => onChange("confirmNewPassword", event.target.value)}
            hasError={Boolean(formErrors.confirmNewPassword)}
            placeholder="••••••••"
          />
        </FormGroup>

        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" loading={submitLoading}>
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  );
}
