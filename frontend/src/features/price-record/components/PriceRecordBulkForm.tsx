"use client";

import { MdSave } from "react-icons/md";
import Button from "@/shared/components/Button";
import { FieldError } from "@/shared/components/FieldError";
import FormGroup from "@/shared/components/FormGroup";
import Input from "@/shared/components/Input";
import SearchableSelect from "@/shared/components/SearchableSelect";
import Select from "@/shared/components/Select";
import Skeleton from "@/shared/components/Skeleton";
import { formatCurrency } from "@/shared/utils/currency";
import type { StoreOption } from "../types/price-record.types";

/** One row of the commodity list: what the officer sees next to the price input. */
export type BulkCommodityRow = {
  id: string;
  name: string;
  categoryName: string;
  srp: number | null;
};

export type PriceRecordBulkErrors = {
  storeId?: string;
  dateAndTime?: string;
  /** Date range mode (PRICE_RECORD_DATE_RANGE_ENABLED). */
  dateFrom?: string;
  dateTo?: string;
  /** Shown above the list, e.g. "Enter at least one price." */
  list?: string;
  /** Per commodity id. */
  prices?: Record<string, string>;
};

interface PriceRecordBulkFormProps {
  stores: StoreOption[];
  /** Already narrowed to `categoryId` by the caller. */
  rows: BulkCommodityRow[];
  categoryOptions: { value: string; label: string }[];
  optionsLoading: boolean;
  storeId: string;
  categoryId: string;
  dateAndTime: string;
  /** Typed prices per commodity id — kept across category changes. */
  prices: Record<string, string>;
  /** How many commodities (in any category) have a price typed in. */
  enteredCount: number;
  errors: PriceRecordBulkErrors;
  formError: string | null;
  isSaving: boolean;
  onStoreChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDateAndTimeChange: (value: string) => void;
  onPriceChange: (commodityId: string, value: string) => void;
  onSave: () => void;
  /**
   * When set, the form asks for a From – To date range instead of one date &
   * time (PRICE_RECORD_DATE_RANGE_ENABLED); `dateAndTime` is then unused.
   */
  dateRange?: {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
  };
}

/**
 * Add Price Record, bulk version (PRICE_RECORD_BULK_ENTRY_ENABLED): one store
 * and one date & time, then a price per commodity from a category-filtered,
 * scrollable list. Save records one price record per commodity with a price.
 */
export default function PriceRecordBulkForm({
  stores,
  rows,
  categoryOptions,
  optionsLoading,
  storeId,
  categoryId,
  dateAndTime,
  prices,
  enteredCount,
  errors,
  formError,
  isSaving,
  onStoreChange,
  onCategoryChange,
  onDateAndTimeChange,
  onPriceChange,
  onSave,
  dateRange,
}: PriceRecordBulkFormProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormGroup label="Store" htmlFor="bulk-record-store" error={errors.storeId}>
          <Select
            id="bulk-record-store"
            value={storeId}
            onChange={(event) => onStoreChange(event.target.value)}
            hasError={Boolean(errors.storeId)}
            disabled={isSaving}
          >
            <option value="">Select store</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} · {store.location}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup label="Category" htmlFor="bulk-record-category">
          <SearchableSelect
            id="bulk-record-category"
            value={categoryId}
            onChange={onCategoryChange}
            options={categoryOptions}
            placeholder="All categories"
            searchPlaceholder="Search category"
            emptyLabel="No categories found."
            clearLabel="All categories"
            isLoading={optionsLoading}
            aria-label="Filter commodities by category"
          />
        </FormGroup>
      </div>

      <section
        aria-label="Commodity prices"
        className="rounded-xl border border-outline-variant bg-surface-container-low"
      >
        <div className="flex flex-col gap-3 border-b border-outline-variant p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-body-sm font-semibold text-on-surface">Commodities</h3>
            <p className="text-xs text-on-surface-variant">
              {optionsLoading
                ? "Loading commodities..."
                : `${rows.length} listed · ${enteredCount} with a price`}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {dateRange ? (
              <fieldset className="min-w-0">
                <legend className="sr-only">Date range</legend>
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0 sm:w-40">
                    <label
                      htmlFor="bulk-record-date-from"
                      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-outline"
                    >
                      Start date
                    </label>
                    <Input
                      id="bulk-record-date-from"
                      type="date"
                      value={dateRange.from}
                      max={dateRange.to || undefined}
                      onChange={(event) => dateRange.onFromChange(event.target.value)}
                      hasError={Boolean(errors.dateFrom)}
                      disabled={isSaving}
                    />
                    <FieldError message={errors.dateFrom} />
                  </div>
                  <div className="min-w-0 sm:w-40">
                    <label
                      htmlFor="bulk-record-date-to"
                      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-outline"
                    >
                      End date
                    </label>
                    <Input
                      id="bulk-record-date-to"
                      type="date"
                      value={dateRange.to}
                      min={dateRange.from || undefined}
                      onChange={(event) => dateRange.onToChange(event.target.value)}
                      hasError={Boolean(errors.dateTo)}
                      disabled={isSaving}
                    />
                    <FieldError message={errors.dateTo} />
                  </div>
                </div>
              </fieldset>
            ) : (
            <div className="sm:w-56">
              <label
                htmlFor="bulk-record-date"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-outline"
              >
                Date &amp; Time
              </label>
              <Input
                id="bulk-record-date"
                type="datetime-local"
                value={dateAndTime}
                onChange={(event) => onDateAndTimeChange(event.target.value)}
                hasError={Boolean(errors.dateAndTime)}
                disabled={isSaving}
              />
              <FieldError message={errors.dateAndTime} />
            </div>
            )}
            {/* sm:mt-6 drops the button past the date label so it lines up with the field.
                No Cancel here — the dialog's own Close button dismisses the form. */}
            <div className="flex sm:mt-6">
              <Button onClick={onSave} loading={isSaving} className="w-full sm:w-auto">
                <MdSave size={18} />
                {isSaving ? "Saving..." : enteredCount > 0 ? `Save (${enteredCount})` : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {errors.list ? (
          <p role="alert" className="border-b border-outline-variant px-4 py-2 text-xs font-medium text-error">
            {errors.list}
          </p>
        ) : null}

        {/* Capped so the dialog still fits a short screen — the shared Modal does not scroll. */}
        <ul className="max-h-[40vh] divide-y divide-outline-variant/40 overflow-y-auto">
          {optionsLoading ? (
            Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-11 w-32 rounded-lg" />
              </li>
            ))
          ) : rows.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-on-surface-variant">
              No commodities in this category.
            </li>
          ) : (
            rows.map((row) => {
              const error = errors.prices?.[row.id];
              return (
                <li key={row.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0 pt-1">
                    <p className="text-sm font-semibold text-on-surface">{row.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {row.categoryName} · SRP {row.srp != null ? formatCurrency(row.srp) : "not set"}
                    </p>
                  </div>
                  <div className="w-32 shrink-0">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      value={prices[row.id] ?? ""}
                      onChange={(event) => onPriceChange(row.id, event.target.value)}
                      hasError={Boolean(error)}
                      disabled={isSaving}
                      aria-label={`Price for ${row.name}`}
                    />
                    <FieldError message={error} />
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {formError ? <p className="text-body-sm text-error">{formError}</p> : null}
    </div>
  );
}
