"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/shared/components/Modal";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import SearchableSelect from "@/shared/components/SearchableSelect";
import Button from "@/shared/components/Button";
import {
  createCommoditySchema,
  commodityStatusOptions,
  type CreateCommodityFormSchema,
} from "../commodity.schema";
import { getMaxSrpEffectiveDateString } from "@/shared/utils/srp-effective-date";

const statusOptions = commodityStatusOptions;

export type CategoryOption = { id: string; name: string };

type AddCommodityDialogProps = {
  open: boolean;
  mode?: "create" | "edit";
  defaultValues?: CreateCommodityFormSchema;
  categoryOptions: CategoryOption[];
  categoryOptionsLoading?: boolean;
  nameError?: string | null;
  formError: string | null;
  formSuccess: string | null;
  submitLoading: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCommodityFormSchema) => Promise<void> | void;
};

const emptyFormValues: CreateCommodityFormSchema = {
  name: "",
  categoryId: "",
  status: "Active",
  srpPrice: "",
  srpEffectiveDate: "",
};

export default function AddCommodityDialog({
  open,
  mode = "create",
  defaultValues,
  categoryOptions,
  categoryOptionsLoading = false,
  nameError,
  formError,
  formSuccess,
  submitLoading,
  onClose,
  onSubmit,
}: AddCommodityDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setError,
    clearErrors,
    watch,
    setValue,
  } = useForm<CreateCommodityFormSchema>({
    defaultValues: defaultValues ?? emptyFormValues,
    mode: "onSubmit",
  });

  const categoryId = watch("categoryId");

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit Commodity" : "Add New Commodity"}
      description={
        mode === "edit"
          ? "Update commodity details, or record a new SRP effective from a given date."
          : "Register a new commodity for monitoring and compliance tracking."
      }
    >
      <form className="mx-auto grid w-full max-w-xl gap-4 sm:grid-cols-2" onSubmit={handleFormSubmit}>
        <div className="sm:col-span-2">
          <FormGroup label="Commodity Name" htmlFor="name" error={errors.name?.message ?? nameError ?? undefined}>
            <Input
              id="name"
              type="text"
              {...register("name")}
              hasError={Boolean(errors.name) || Boolean(nameError)}
              placeholder="e.g. Absolute Distilled Water"
            />
          </FormGroup>
        </div>

        <FormGroup label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
          <SearchableSelect
            id="categoryId"
            value={categoryId}
            onChange={(value) => setValue("categoryId", value, { shouldDirty: true, shouldValidate: true })}
            options={categoryOptions.map((option) => ({ value: option.id, label: option.name }))}
            placeholder="Select category"
            searchPlaceholder="Search category"
            emptyLabel="No categories found."
            isLoading={categoryOptionsLoading}
            hasError={Boolean(errors.categoryId)}
            aria-label="Category"
          />
        </FormGroup>

        <FormGroup label="Status" htmlFor="status" error={errors.status?.message}>
          <Select id="status" {...register("status")} hasError={Boolean(errors.status)}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup
          label={mode === "edit" ? "New SRP Price (PHP) — Optional" : "SRP Price (PHP) — Optional"}
          htmlFor="srpPrice"
          error={errors.srpPrice?.message}
        >
          <Input
            id="srpPrice"
            type="number"
            step="0.01"
            {...register("srpPrice")}
            hasError={Boolean(errors.srpPrice)}
            placeholder="e.g. 55.00"
          />
        </FormGroup>

        <FormGroup
          label="Effective Date (required with SRP price)"
          htmlFor="srpEffectiveDate"
          error={errors.srpEffectiveDate?.message}
        >
          <Input
            id="srpEffectiveDate"
            type="date"
            max={getMaxSrpEffectiveDateString()}
            {...register("srpEffectiveDate")}
            hasError={Boolean(errors.srpEffectiveDate)}
          />
        </FormGroup>

        {mode === "edit" ? (
          <p className="text-xs text-on-surface-variant sm:col-span-2">
            SRP is historical — entering a price and date here adds a new SRP record effective from that date, it does not overwrite the current one.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={submitLoading || isSubmitting || (mode === "edit" && !isDirty)}
          >
            {submitLoading || isSubmitting
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
                ? "Save Changes"
                : "Create Commodity"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
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
    </Modal>
  );
}
