"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/shared/components/Modal";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import Button from "@/shared/components/Button";
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit User" : "Add New User"}
      description={
        mode === "edit"
          ? "Update user details and save changes."
          : "Add a new system user and configure their access."
      }
    >
      <form className="mx-auto grid w-full max-w-xl gap-4 sm:grid-cols-2" onSubmit={handleFormSubmit}>
        <FormGroup label="Full Name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            type="text"
            {...register("name")}
            hasError={Boolean(errors.name)}
            placeholder="Jane Dela Cruz"
          />
        </FormGroup>

        <FormGroup label="Email Address" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            {...register("email")}
            hasError={Boolean(errors.email)}
            placeholder="jane.dc@gov.ph"
          />
        </FormGroup>

        <FormGroup label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            {...register("password")}
            hasError={Boolean(errors.password)}
            placeholder="••••••••"
          />
        </FormGroup>

        <FormGroup label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            hasError={Boolean(errors.confirmPassword)}
            placeholder="••••••••"
          />
        </FormGroup>

        <FormGroup label="Primary Role" htmlFor="role" error={errors.role?.message}>
          <Select id="role" {...register("role")} hasError={Boolean(errors.role)}>
            <option value="">Select role</option>
            <option value="ADMIN">Administrator</option>
            <option value="OFFICER">Officer</option>
          </Select>
        </FormGroup>

        <div className="space-y-1.5">
          <label className="block text-body-sm font-medium text-on-surface" htmlFor="isActive">
            Account Status
          </label>
          <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3">
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
          <Button type="submit" disabled={submitLoading || isSubmitting}>
            {submitLoading || isSubmitting
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
                ? "Save Changes"
                : "Create User"}
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
