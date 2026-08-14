"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  createCommoditySchema,
  commodityStatusOptions,
  type CreateCommodityFormSchema,
} from "../commodity.schema";

const statusOptions = commodityStatusOptions;

type AddCommodityDialogProps = {
  open: boolean;
  mode?: "create" | "edit";
  defaultValues?: CreateCommodityFormSchema;
  formError: string | null;
  formSuccess: string | null;
  submitLoading: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCommodityFormSchema) => Promise<void> | void;
};

const emptyFormValues: CreateCommodityFormSchema = {
  name: "",
  category: "",
  status: "Active",
};

export default function AddCommodityDialog({
  open,
  mode = "create",
  defaultValues,
  formError,
  formSuccess,
  submitLoading,
  onClose,
  onSubmit,
}: AddCommodityDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
  } = useForm<CreateCommodityFormSchema>({
    defaultValues: defaultValues ?? emptyFormValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues ?? emptyFormValues);
      clearErrors();
    }
  }, [open, defaultValues, reset, clearErrors]);

  const handleFormSubmit = handleSubmit(async (data) => {
    clearErrors();

    const result = createCommoditySchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof CreateCommodityFormSchema, {
            type: "validation",
            message: issue.message,
          });
        }
      });
      return;
    }

    await onSubmit(result.data);
  });

  if (!open) return null;

  const inputClassName =
    "w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const inputErrorClassName = "border-error focus:border-error focus:ring-error/20";
  const getInputClassName = (field: keyof CreateCommodityFormSchema) =>
    `${inputClassName} ${errors[field] ? inputErrorClassName : ""}`.trim();

  const renderFieldError = (field: keyof CreateCommodityFormSchema) => {
    const fieldError = errors[field];
    if (!fieldError?.message) return null;
    return (
      <p className="mt-1 text-xs font-medium text-error" role="alert">
        {fieldError.message}
      </p>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-h3-desktop font-semibold text-on-surface">
              {mode === "edit" ? "Edit Commodity" : "Add New Commodity"}
            </h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              {mode === "edit"
                ? "Update commodity details for monitoring and compliance tracking."
                : "Register a new commodity for monitoring and compliance tracking."}
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
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="name">
              Commodity Name
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={getInputClassName("name")}
              placeholder="Coconut Oil"
            />
            {renderFieldError("name")}
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              type="text"
              {...register("category")}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? "category-error" : undefined}
              className={getInputClassName("category")}
              placeholder="Food Staples"
            />
            {renderFieldError("category")}
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              {...register("status")}
              aria-invalid={Boolean(errors.status)}
              aria-describedby={errors.status ? "status-error" : undefined}
              className={getInputClassName("status")}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {renderFieldError("status")}
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
                : "Create Commodity"}
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
