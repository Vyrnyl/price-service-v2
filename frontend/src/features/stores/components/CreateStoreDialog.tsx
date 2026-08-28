import { type FormEvent } from "react";
import { StoreFormData } from "../types/stores.types";
import Modal from "@/shared/components/Modal";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";

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
    <Modal
      open
      onClose={onClose}
      title={isEditMode ? "Edit Outlet" : "Add New Outlet"}
      description={isEditMode ? "Update the selected outlet details below." : "Register a new store with your officer account."}
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <FormGroup label="Store Name" htmlFor="store-name" error={formErrors.name}>
          <Input
            id="store-name"
            type="text"
            value={formData.name}
            onChange={(event) => onChange("name", event.target.value)}
            hasError={Boolean(formErrors.name)}
            placeholder="Virac Plaza Supermarket"
          />
        </FormGroup>

        <FormGroup label="Location" htmlFor="store-location" error={formErrors.location}>
          <Input
            id="store-location"
            type="text"
            value={formData.location}
            onChange={(event) => onChange("location", event.target.value)}
            hasError={Boolean(formErrors.location)}
            placeholder="Poblacion, Virac, Catanduanes"
          />
        </FormGroup>

        <FormGroup label="Last Visited" htmlFor="last-visited">
          <Input
            id="last-visited"
            type="date"
            value={formData.lastVisited}
            onChange={(event) => onChange("lastVisited", event.target.value)}
          />
        </FormGroup>

        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={submitLoading}>
            {submitLoading ? (isEditMode ? "Updating..." : "Creating...") : isEditMode ? "Update Store" : "Create Store"}
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
