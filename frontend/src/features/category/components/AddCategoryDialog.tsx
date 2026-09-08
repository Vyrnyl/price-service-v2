"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/shared/components/Modal";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import {
  createCategorySchema,
  type CreateCategoryFormSchema,
} from "../schemas/category.schema";

type AddCategoryDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  defaultValues?: Partial<CreateCategoryFormSchema>;
  formError: string | null;
  formSuccess: string | null;
  submitLoading: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryFormSchema) => Promise<void> | void;
};

const emptyFormValues: CreateCategoryFormSchema = { name: "" };

export default function AddCategoryDialog({
  open,
  mode,
  defaultValues,
  formError,
  formSuccess,
  submitLoading,
  onClose,
  onSubmit: submitCategory,
}: AddCategoryDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setError,
    clearErrors,
  } = useForm<CreateCategoryFormSchema>({
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

    const result = createCategorySchema.safeParse(data);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof CreateCategoryFormSchema, {
            type: "validation",
            message: issue.message,
          });
        }
      });
      return;
    }

    await submitCategory(result.data);
  });

  const saveDisabled = submitLoading || isSubmitting || (mode === "edit" && !isDirty);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit Category" : "Add New Category"}
      description={
        mode === "edit"
          ? "Rename this category. It stays applied to every commodity that already uses it."
          : "Add a new commodity category. It will be available on the Add Commodity form immediately."
      }
    >
      <form className="mx-auto grid w-full max-w-md gap-4" onSubmit={handleFormSubmit}>
        <FormGroup label="Category Name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            type="text"
            {...register("name")}
            hasError={Boolean(errors.name)}
            placeholder="AG"
          />
        </FormGroup>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={saveDisabled}>
            {submitLoading || isSubmitting
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
                ? "Save Changes"
                : "Create Category"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {(formError || formSuccess) && (
          <div>
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
