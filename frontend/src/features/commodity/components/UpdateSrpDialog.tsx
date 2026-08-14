import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

  if (!open) return null;

  const inputBase = "w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const inputError = "border-error focus:border-error focus:ring-error/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-h3-desktop font-semibold text-on-surface">Update Commodity SRP</h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              Provide the latest suggested retail price for {commodityName ?? "this commodity"}.
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

        <form className="grid gap-4" onSubmit={handleFormSubmit}>
          <div>
            <label htmlFor="price" className="block text-body-sm font-medium text-on-surface">
              SRP Price (PHP)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              {...register("price")}
              className={`${inputBase} ${errors.price ? inputError : ""}`}
              placeholder="e.g. 55.00"
            />
            {errors.price?.message ? <p className="mt-1 text-xs text-error">{errors.price.message}</p> : null}
          </div>

          <div>
            <label htmlFor="effectiveDate" className="block text-body-sm font-medium text-on-surface">
              Effective Date
            </label>
            <input
              id="effectiveDate"
              type="date"
              {...register("effectiveDate")}
              className={`${inputBase} ${errors.effectiveDate ? inputError : ""}`}
            />
            {errors.effectiveDate?.message ? (
              <p className="mt-1 text-xs text-error">{errors.effectiveDate.message}</p>
            ) : null}
          </div>

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
            <button
              type="submit"
              disabled={submitLoading || isSubmitting}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLoading || isSubmitting ? "Saving..." : "Update SRP"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-outline px-6 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
