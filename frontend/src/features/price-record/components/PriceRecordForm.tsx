"use client";

import { type FormEvent } from "react";
import { FieldError } from "@/shared/components/FieldError";
import { INPUT_CLASSES, INPUT_ERROR_CLASSES, PRIMARY_BUTTON_CLASSES } from "@/shared/constants/form.constants";
import type {
  CommodityOption,
  CreatePriceRecordPayload,
  StoreOption,
} from "../types/price-record.types";

interface PriceRecordFormProps {
  stores: StoreOption[];
  commodities: CommodityOption[];
  formError: string | null;
  formErrors: Partial<Record<keyof CreatePriceRecordPayload, string>>;
  submitLoading: boolean;
  newRecord: CreatePriceRecordPayload;
  mode?: "create" | "edit";
  onChange: (field: keyof CreatePriceRecordPayload, value: string | number) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export default function PriceRecordForm({
  stores,
  commodities,
  formError,
  formErrors,
  submitLoading,
  newRecord,
  mode = "create",
  onChange,
  onCancel,
  onSubmit,
}: PriceRecordFormProps) {
  const isEditMode = mode === "edit";
  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-h3-desktop font-semibold text-on-surface">
            {isEditMode ? "Edit Price Record" : "Add Price Record"}
          </h2>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            {isEditMode
              ? "Update the selected commodity price entry from your assigned inspection route."
              : "Record a new commodity price entry from your assigned inspection route."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex rounded-full bg-surface px-3 py-2 text-on-surface transition hover:bg-surface-container-high"
        >
          Close
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-4 lg:grid-cols-2 sm:col-span-2">
          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface">Store</label>
            <select
              value={newRecord.storeId}
              onChange={(event) => onChange("storeId", event.target.value)}
              className={`${INPUT_CLASSES} ${formErrors.storeId ? INPUT_ERROR_CLASSES : ""}`.trim()}
              aria-invalid={Boolean(formErrors.storeId)}
            >
              <option value="">Select store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} · {store.location}
                </option>
              ))}
            </select>
            <FieldError message={formErrors.storeId} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface">Commodity</label>
            <select
              value={newRecord.commodityId}
              onChange={(event) => onChange("commodityId", event.target.value)}
              className={`${INPUT_CLASSES} max-h-48 overflow-y-auto ${formErrors.commodityId ? INPUT_ERROR_CLASSES : ""}`.trim()}
              aria-invalid={Boolean(formErrors.commodityId)}
            >
              <option value="">Select commodity</option>
              {commodities.map((commodity) => (
                <option key={commodity.id} value={commodity.id}>
                  {commodity.name}
                </option>
              ))}
            </select>
            <FieldError message={formErrors.commodityId} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 sm:col-span-2">
          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface">Date & Time</label>
            <input
              type="datetime-local"
              value={newRecord.dateAndTime}
              onChange={(event) => onChange("dateAndTime", event.target.value)}
              className={`${INPUT_CLASSES} ${formErrors.dateAndTime ? INPUT_ERROR_CLASSES : ""}`.trim()}
              aria-invalid={Boolean(formErrors.dateAndTime)}
            />
            <FieldError message={formErrors.dateAndTime} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-sm font-medium text-on-surface">Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newRecord.price || ""}
              onChange={(event) => onChange("price", Number(event.target.value))}
              className={`${INPUT_CLASSES} ${formErrors.price ? INPUT_ERROR_CLASSES : ""}`.trim()}
              placeholder="0.00"
              aria-invalid={Boolean(formErrors.price)}
            />
            <FieldError message={formErrors.price} />
          </div>
        </div>

        {formError ? <p className="text-body-sm text-error sm:col-span-2">{formError}</p> : null}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button type="submit" disabled={submitLoading} className={PRIMARY_BUTTON_CLASSES}>
            {submitLoading ? (isEditMode ? "Updating..." : "Saving...") : isEditMode ? "Update Record" : "Save Record"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-outline-variant bg-surface px-6 py-3 text-body-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
