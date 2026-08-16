"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/shared/components/Modal";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import Button from "@/shared/components/Button";
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit Commodity" : "Add New Commodity"}
      description={
        mode === "edit"
          ? "Update commodity details for monitoring and compliance tracking."
          : "Register a new commodity for monitoring and compliance tracking."
      }
    >
      <form className="mx-auto grid w-full max-w-xl gap-4 sm:grid-cols-2" onSubmit={handleFormSubmit}>
        <div className="sm:col-span-2">
          <FormGroup label="Commodity Name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              type="text"
              {...register("name")}
              hasError={Boolean(errors.name)}
              placeholder="Coconut Oil"
            />
          </FormGroup>
        </div>

        <FormGroup label="Category" htmlFor="category" error={errors.category?.message}>
          <Input
            id="category"
            type="text"
            {...register("category")}
            hasError={Boolean(errors.category)}
            placeholder="Food Staples"
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

        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={submitLoading || isSubmitting}>
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
