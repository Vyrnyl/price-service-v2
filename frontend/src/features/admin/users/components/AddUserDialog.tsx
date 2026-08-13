"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  createUserSchema,
  type CreateUserFormSchema,
  updateUserSchema,
  type UpdateUserFormSchema,
} from "../schemas/users.schema";

type DialogFormValues = CreateUserFormSchema | UpdateUserFormSchema;

type AddUserDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  defaultValues?: Partial<DialogFormValues>;
  formError: string | null;
  formSuccess: string | null;
  submitLoading: boolean;
  onClose: () => void;
  onSubmit: (data: DialogFormValues) => Promise<void> | void;
};

const emptyFormValues: CreateUserFormSchema = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "OFFICER",
  isActive: true,
};

export default function AddUserDialog({
  open,
  mode,
  defaultValues,
  formError,
  formSuccess,
  submitLoading,
  onClose,
  onSubmit: submitUser,
}: AddUserDialogProps) {
  const schema = mode === "create" ? createUserSchema : updateUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
  } = useForm<DialogFormValues>({
    defaultValues: defaultValues ?? emptyFormValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues ?? emptyFormValues);
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    clearErrors();

    const result = schema.safeParse(data);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
          setError(field as keyof DialogFormValues, {
            type: "validation",
            message: issue.message,
          });
        }
      });

      return;
    }

    await submitUser(result.data);
  });

  if (!open) return null;

  const inputClassName =
    "w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const inputErrorClassName = "border-error focus:border-error focus:ring-error/20";

  const getInputClassName = (field: keyof DialogFormValues) =>
    `${inputClassName} ${errors[field] ? inputErrorClassName : ""}`.trim();

  const renderFieldError = (field: keyof DialogFormValues) => {
    const fieldError = errors[field];

    if (!fieldError?.message) {
      return null;
    }

    return (
      <p id={`${String(field)}-error`} role="alert" className="mt-1 text-xs font-medium text-error">
        {fieldError.message}
      </p>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-h3-desktop font-semibold text-on-surface">
              {mode === "edit" ? "Edit User" : "Add New User"}
            </h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              {mode === "edit"
                ? "Update user details and save changes."
                : "Add a new system user and configure their access."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-full bg-surface px-3 py-2 text-on-surface transition hover:bg-surface-container-high"
          >
            Close
          </button>
        </div>

        <form className="mx-auto grid w-full max-w-xl gap-4 sm:grid-cols-2" onSubmit={handleFormSubmit}>
          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={getInputClassName("name")}
              placeholder="Jane Dela Cruz"
            />
            {renderFieldError("name")}
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={getInputClassName("email")}
              placeholder="jane.dc@gov.ph"
            />
            {renderFieldError("email")}
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={getInputClassName("password")}
              placeholder="••••••••"
            />
            {renderFieldError("password")}
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              className={getInputClassName("confirmPassword")}
              placeholder="••••••••"
            />
            {renderFieldError("confirmPassword")}
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="role">
              Primary Role
            </label>
            <select
              id="role"
              {...register("role")}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? "role-error" : undefined}
              className={getInputClassName("role")}
            >
              <option value="">Select role</option>
              <option value="ADMIN">Administrator</option>
              <option value="OFFICER">Officer</option>
            </select>
            {renderFieldError("role")}
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="isActive">
              Account Status
            </label>
            <div className="rounded-xl border border-outline bg-surface px-4 py-3">
              <label className="flex items-center gap-3 text-body-sm text-on-surface">
                <input
                  id="isActive"
                  type="checkbox"
                  {...register("isActive")}
                  className="h-4 w-4 rounded border-outline text-primary focus:ring-primary/30"
                />
                <span>Active account</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={submitLoading || isSubmitting}
              className="rounded-xl bg-primary px-6 py-3 text-body-sm font-semibold text-on-primary transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLoading || isSubmitting
                ? mode === "edit"
                  ? "Saving..."
                  : "Creating..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Create User"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline px-6 py-3 text-body-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
            >
              Cancel
            </button>
          </div>

          {(formError || formSuccess) && (
            <div className="sm:col-span-2">
              {formError ? (
                <p className="text-center text-xs font-medium text-error">{formError}</p>
              ) : (
                <p className="text-center text-xs font-medium text-secondary">{formSuccess}</p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
