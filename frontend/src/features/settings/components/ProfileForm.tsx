"use client";

import { type FormEvent } from "react";
import Card from "@/shared/components/Card";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import Alert from "@/shared/components/Alert";
import type { ProfileFormValues } from "../types/settings.types";

interface ProfileFormProps {
  values: ProfileFormValues;
  formErrors: Partial<Record<keyof ProfileFormValues, string>>;
  formError: string | null;
  submitLoading: boolean;
  onChange: (field: keyof ProfileFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function ProfileForm({
  values,
  formErrors,
  formError,
  submitLoading,
  onChange,
  onSubmit,
}: ProfileFormProps) {
  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-h3-desktop font-semibold text-on-surface">Profile Information</h2>
      <p className="mt-1 text-body-sm text-on-surface-variant">
        Update the name and email address associated with your account.
      </p>

      {formError ? (
        <Alert variant="error" className="mt-4">
          {formError}
        </Alert>
      ) : null}

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <FormGroup label="Full Name" htmlFor="profile-name" error={formErrors.name}>
          <Input
            id="profile-name"
            value={values.name}
            onChange={(event) => onChange("name", event.target.value)}
            hasError={Boolean(formErrors.name)}
            placeholder="Jane Dela Cruz"
          />
        </FormGroup>

        <FormGroup label="Email Address" htmlFor="profile-email" error={formErrors.email}>
          <Input
            id="profile-email"
            type="email"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
            hasError={Boolean(formErrors.email)}
            placeholder="jane.dc@gov.ph"
          />
        </FormGroup>

        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" loading={submitLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
