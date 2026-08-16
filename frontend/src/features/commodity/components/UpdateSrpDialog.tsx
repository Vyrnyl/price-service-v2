import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Modal from "@/shared/components/Modal";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";

type UpdateSrpDialogProps = {
  open: boolean;
  commodityName: string | null;
  defaultValues?: FormValues;
  onClose: () => void;
  onSubmit: (payload: { price: number; effectiveDate: string }) => Promise<void>;
  submitLoading: boolean;
  formError: string | null;
  formSuccess: string | null;
};

const schema = z.object({
  price: z.coerce.number().positive("Price must be greater than 0"),
  effectiveDate: z.string().min(1, "Effective date is required"),
});

type FormValues = z.infer<typeof schema>;

const initialValues: FormValues = {
  price: 0,
  effectiveDate: "",
};

export default function UpdateSrpDialog({
  open,
  commodityName,
  defaultValues,
  onClose,
  onSubmit,
  submitLoading,
  formError,
  formSuccess,
}: UpdateSrpDialogProps) {
  const defaultValuesJson = JSON.stringify(defaultValues ?? initialValues);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    const values = defaultValues ?? initialValues;
    if (open) {
      reset(values, {
        keepDefaultValues: false,
        keepValues: false,
      });
    }
  }, [open, reset, defaultValuesJson]);

  const handleFormSubmit = handleSubmit(async (data) => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormValues;
        setError(field, { type: "validation", message: issue.message });
      });
      return;
    }

    await onSubmit(parsed.data);
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Commodity SRP"
      description={`Provide the latest suggested retail price for ${commodityName ?? "this commodity"}.`}
    >
      <form className="grid gap-4" onSubmit={handleFormSubmit}>
        <FormGroup label="SRP Price (PHP)" htmlFor="price" error={errors.price?.message}>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register("price")}
            hasError={Boolean(errors.price)}
            placeholder="e.g. 55.00"
          />
        </FormGroup>

        <FormGroup label="Effective Date" htmlFor="effectiveDate" error={errors.effectiveDate?.message}>
          <Input
            id="effectiveDate"
            type="date"
            {...register("effectiveDate")}
            hasError={Boolean(errors.effectiveDate)}
          />
        </FormGroup>

        {(formError || formSuccess) && (
          <div>
            {formError ? (
              <p className="text-xs font-medium text-error">{formError}</p>
            ) : (
              <p className="text-xs font-medium text-secondary">{formSuccess}</p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={submitLoading || isSubmitting}>
            {submitLoading || isSubmitting ? "Saving..." : "Update SRP"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
