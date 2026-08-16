"use client";

import { type FormEvent } from "react";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import Button from "@/shared/components/Button";
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
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-4 lg:grid-cols-2 sm:col-span-2">
          <FormGroup label="Store" htmlFor="record-store" error={formErrors.storeId}>
            <Select
              id="record-store"
              value={newRecord.storeId}
              onChange={(event) => onChange("storeId", event.target.value)}
              hasError={Boolean(formErrors.storeId)}
            >
              <option value="">Select store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} · {store.location}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Commodity" htmlFor="record-commodity" error={formErrors.commodityId}>
            <Select
              id="record-commodity"
              value={newRecord.commodityId}
              onChange={(event) => onChange("commodityId", event.target.value)}
              hasError={Boolean(formErrors.commodityId)}
              className="max-h-48 overflow-y-auto"
            >
              <option value="">Select commodity</option>
              {commodities.map((commodity) => (
                <option key={commodity.id} value={commodity.id}>
                  {commodity.name}
                </option>
              ))}
            </Select>
          </FormGroup>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 sm:col-span-2">
          <FormGroup label="Date & Time" htmlFor="record-date" error={formErrors.dateAndTime}>
            <Input
              id="record-date"
              type="datetime-local"
              value={newRecord.dateAndTime}
              onChange={(event) => onChange("dateAndTime", event.target.value)}
              hasError={Boolean(formErrors.dateAndTime)}
            />
          </FormGroup>

          <FormGroup label="Price" htmlFor="record-price" error={formErrors.price}>
            <Input
              id="record-price"
              type="number"
              step="0.01"
              min="0"
              value={newRecord.price || ""}
              onChange={(event) => onChange("price", Number(event.target.value))}
              hasError={Boolean(formErrors.price)}
              placeholder="0.00"
            />
          </FormGroup>
        </div>

        {formError ? <p className="text-body-sm text-error sm:col-span-2">{formError}</p> : null}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <Button type="submit" disabled={submitLoading}>
            {submitLoading ? (isEditMode ? "Updating..." : "Saving...") : isEditMode ? "Update Record" : "Save Record"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
  );
}
