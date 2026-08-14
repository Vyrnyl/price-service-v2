import { type FormEvent } from "react";
import { StoreFormData } from "../types/stores.types";
import { FieldError } from "@/shared/components/FieldError";
import { INPUT_CLASSES, INPUT_ERROR_CLASSES, PRIMARY_BUTTON_CLASSES } from "@/shared/constants/form.constants";

export function CreateStoreDialog({
  formData,
  formErrors,
  formError,
  formSuccess,
  submitLoading,
  mode = "create",
  onClose,
  onChange,
  onSubmit,
}: {
  formData: StoreFormData;
  formErrors: Partial<Record<keyof StoreFormData, string>>;
  formError: string | null;
  formSuccess: string | null;
  submitLoading: boolean;
  mode?: "create" | "edit";
  onClose: () => void;
  onChange: (field: keyof StoreFormData, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const isEditMode = mode === "edit";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-h3-desktop font-semibold text-on-surface">
              {isEditMode ? "Edit Outlet" : "Add New Outlet"}
            </h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              {isEditMode ? "Update the selected outlet details below." : "Register a new store with your officer account."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex rounded-full bg-surface px-3 py-2 text-on-surface transition hover:bg-surface-container-high">
            Close
          </button>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="store-name">
              Store Name
            </label>
            <input
              id="store-name"
              type="text"
              value={formData.name}
              onChange={(event) => onChange("name", event.target.value)}
              aria-invalid={Boolean(formErrors.name)}
              aria-describedby={formErrors.name ? "store-name-error" : undefined}
              className={`${INPUT_CLASSES} ${formErrors.name ? INPUT_ERROR_CLASSES : ""}`.trim()}
              placeholder="Virac Plaza Supermarket"
            />
            <FieldError message={formErrors.name} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="store-location">
              Location
            </label>
            <input
              id="store-location"
              type="text"
              value={formData.location}
              onChange={(event) => onChange("location", event.target.value)}
              aria-invalid={Boolean(formErrors.location)}
              aria-describedby={formErrors.location ? "store-location-error" : undefined}
              className={`${INPUT_CLASSES} ${formErrors.location ? INPUT_ERROR_CLASSES : ""}`.trim()}
              placeholder="Poblacion, Virac, Catanduanes"
            />
            <FieldError message={formErrors.location} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface" htmlFor="last-visited">
              Last Visited
            </label>
            <input
              id="last-visited"
              type="date"
              value={formData.lastVisited}
              onChange={(event) => onChange("lastVisited", event.target.value)}
              className={INPUT_CLASSES}
            />
          </div>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
            <button type="submit" disabled={submitLoading} className={PRIMARY_BUTTON_CLASSES}>
              {submitLoading ? (isEditMode ? "Updating..." : "Creating...") : isEditMode ? "Update Store" : "Create Store"}
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
