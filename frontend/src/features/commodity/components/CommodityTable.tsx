"use client";

import { MdEdit, MdHistory, MdSave, MdSearch } from "react-icons/md";
import type { ComponentType } from "react";
import Button from "@/shared/components/Button";
import { FieldError } from "@/shared/components/FieldError";
import Input from "@/shared/components/Input";
import Pagination from "@/shared/components/Pagination";
import SearchableSelect, { type SearchableSelectOption } from "@/shared/components/SearchableSelect";
import Skeleton from "@/shared/components/Skeleton";
import type { CommodityItem } from "../services/commodity.api";
import type { CommodityStatus } from "../commodity.schema";

export type CommodityRow = {
  id: string;
  name: string;
  category: string;
  status: CommodityStatus;
  srp: string;
  /** The current SRP as a plain number string ("37.25"), or null when the commodity has none. */
  srpValue: string | null;
  effectiveDate: string;
  statusClass: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
};

/** Category dropdown in the filter panel. Omit to hide it (COMMODITY_CATEGORY_FILTER_ENABLED). */
export type CategoryFilterControl = {
  /** Category id, or "" for all categories. */
  value: string;
  options: SearchableSelectOption[];
  isLoading: boolean;
  onChange: (value: string) => void;
};

/** Inline SRP editor. Omit to hide it (INLINE_SRP_EDIT_ENABLED, officer only). */
export type SrpEditControl = {
  isEditing: boolean;
  isSaving: boolean;
  /** Draft SRP per commodity id, as typed. A row without one shows its current SRP. */
  drafts: Record<string, string>;
  /** Validation message per commodity id. */
  errors: Record<string, string>;
  /** Errors on rows not in the current page/filters, named so they aren't lost. */
  offPageErrorNotice?: string | null;
  /**
   * Filters and pagination stay usable while editing (SRP_EDIT_BROWSE_ENABLED).
   * They are always locked during a save.
   */
  canBrowse?: boolean;
  effectiveDate: string;
  effectiveDateError: string | null;
  maxEffectiveDate: string;
  changedCount: number;
  onStart: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDraftChange: (commodityId: string, value: string) => void;
  onEffectiveDateChange: (value: string) => void;
  /**
   * Optional end of the Effective Date range (SRP_DATE_RANGE_ENABLED). When
   * `onEffectiveEndDateChange` is absent the single Effective Date is shown.
   */
  effectiveEndDate?: string;
  effectiveEndDateError?: string | null;
  onEffectiveEndDateChange?: (value: string) => void;
};

const PAGE_SIZE = 5;

type CommodityTableProps = {
  commodityRows: CommodityRow[];
  total: number;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: "ALL" | "Active" | "Inactive";
  currentPage: number;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: "ALL" | "Active" | "Inactive") => void;
  onPageChange: (page: number) => void;
  onEditCommodity?: (commodity: Pick<CommodityItem, "id">) => void;
  onViewSrpHistory?: (row: CommodityRow) => void;
  categoryFilter?: CategoryFilterControl;
  srpEdit?: SrpEditControl;
};

export default function CommodityTable({
  commodityRows,
  total,
  isLoading,
  error,
  searchTerm,
  statusFilter,
  currentPage,
  onSearchTermChange,
  onStatusFilterChange,
  onPageChange,
  onEditCommodity,
  onViewSrpHistory,
  categoryFilter,
  srpEdit,
}: CommodityTableProps) {
  const showActions = Boolean(onEditCommodity || onViewSrpHistory);
  const isEditingSrp = Boolean(srpEdit?.isEditing);
  // Drafts are kept per commodity, so with `canBrowse` the officer may page and
  // filter while editing. Filters and paging are locked (`inert`) only during a
  // save — or for the whole edit when `canBrowse` is off.
  const lockBrowsing = isEditingSrp && (!srpEdit?.canBrowse || Boolean(srpEdit?.isSaving));
  const columnCount = showActions ? 6 : 5;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = total === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(startIndex + commodityRows.length - 1, total);

  return (
    <div className="flex min-h-105 flex-1 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h4 className="font-sans text-h3-desktop text-on-surface">Commodity with SRP</h4>
          <p className="text-body-sm text-on-surface-variant">
            Active market listings and monitoring status
          </p>
        </div>

        {srpEdit ? (
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start md:w-auto">
            {srpEdit.onEffectiveEndDateChange ? (
              <fieldset className="min-w-0">
                <legend className="sr-only">Effective date range</legend>
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0 sm:w-40">
                    <label
                      htmlFor="srp-effective-date"
                      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-outline"
                    >
                      Start date
                    </label>
                    <Input
                      id="srp-effective-date"
                      type="date"
                      max={srpEdit.maxEffectiveDate}
                      value={srpEdit.effectiveDate}
                      disabled={!srpEdit.isEditing || srpEdit.isSaving}
                      hasError={Boolean(srpEdit.effectiveDateError)}
                      onChange={(event) => srpEdit.onEffectiveDateChange(event.target.value)}
                      className="disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <FieldError message={srpEdit.effectiveDateError ?? undefined} />
                  </div>
                  <div className="min-w-0 sm:w-40">
                    <label
                      htmlFor="srp-effective-end-date"
                      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-outline"
                    >
                      End date <span className="normal-case tracking-normal">(optional)</span>
                    </label>
                    <Input
                      id="srp-effective-end-date"
                      type="date"
                      min={srpEdit.effectiveDate || undefined}
                      value={srpEdit.effectiveEndDate ?? ""}
                      disabled={!srpEdit.isEditing || srpEdit.isSaving}
                      hasError={Boolean(srpEdit.effectiveEndDateError)}
                      onChange={(event) => srpEdit.onEffectiveEndDateChange?.(event.target.value)}
                      className="disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <FieldError message={srpEdit.effectiveEndDateError ?? undefined} />
                  </div>
                </div>
              </fieldset>
            ) : (
            <div className="sm:w-44">
              <label
                htmlFor="srp-effective-date"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-outline"
              >
                Effective Date
              </label>
              <Input
                id="srp-effective-date"
                type="date"
                max={srpEdit.maxEffectiveDate}
                value={srpEdit.effectiveDate}
                disabled={!srpEdit.isEditing || srpEdit.isSaving}
                hasError={Boolean(srpEdit.effectiveDateError)}
                onChange={(event) => srpEdit.onEffectiveDateChange(event.target.value)}
                className="disabled:cursor-not-allowed disabled:opacity-60"
              />
              <FieldError message={srpEdit.effectiveDateError ?? undefined} />
            </div>
            )}
            {/* sm:mt-6 drops the buttons past the date label so they line up with the field. */}
            <div className="flex gap-2 sm:mt-6">
              {srpEdit.isEditing ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={srpEdit.onCancel}
                    disabled={srpEdit.isSaving}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={srpEdit.onSave}
                    loading={srpEdit.isSaving}
                    className="flex-1 sm:flex-none"
                  >
                    <MdSave size={18} />
                    {srpEdit.isSaving
                      ? "Saving..."
                      : srpEdit.changedCount > 0
                        ? `Save (${srpEdit.changedCount})`
                        : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={srpEdit.onStart}
                  disabled={isLoading || Boolean(error) || commodityRows.length === 0}
                  className="w-full sm:w-auto"
                >
                  <MdEdit size={18} />
                  ADD NEW SRP
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {srpEdit?.isEditing && (srpEdit.canBrowse || srpEdit.offPageErrorNotice) ? (
        <div className="mb-4 space-y-1">
          {srpEdit.canBrowse ? (
            <p className="text-body-sm text-on-surface-variant">
              Prices you type are kept when you search, filter or change page. Save records all of them.
            </p>
          ) : null}
          <FieldError message={srpEdit.offPageErrorNotice ?? undefined} />
        </div>
      ) : null}

      <div
        className={`mb-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 ${lockBrowsing ? "opacity-60" : ""}`}
        inert={lockBrowsing}
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative w-full md:flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
            <input
              className="w-full rounded-xl border border-outline-variant bg-surface py-3 pl-10 pr-4 text-body-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Filter by commodity name, category, or status..."
              aria-label="Search commodities"
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
            />
          </div>
          {categoryFilter ? (
            <div className="w-full md:w-64 md:shrink-0">
              <SearchableSelect
                value={categoryFilter.value}
                onChange={categoryFilter.onChange}
                options={categoryFilter.options}
                placeholder="All categories"
                searchPlaceholder="Search category"
                emptyLabel="No categories found."
                clearLabel="All categories"
                isLoading={categoryFilter.isLoading}
                aria-label="Filter by category"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap text-body-sm font-semibold text-on-surface-variant">
            Filter by status:
          </span>
          {(["ALL", "Active", "Inactive"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onStatusFilterChange(option)}
              className={`rounded-full px-4 py-1.5 text-label-caps font-semibold transition-colors ${
                statusFilter === option
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {option === "ALL" ? "All Status" : option}
            </button>
          ))}
        </div>
      </div>

      {/* `relative` keeps the Actions column's absolutely-positioned sr-only
          labels inside the scroller; without it they escape and widen the page
          once the SRP inputs make the table wider than a phone screen. */}
      <div className="relative overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="whitespace-nowrap px-3 pb-4 first:pl-0 last:pr-0 text-[10px] font-semibold uppercase tracking-wide text-outline">Commodity</th>
              <th className="whitespace-nowrap px-3 pb-4 first:pl-0 last:pr-0 text-[10px] font-semibold uppercase tracking-wide text-outline">Category</th>
              <th className="whitespace-nowrap px-3 pb-4 first:pl-0 last:pr-0 text-[10px] font-semibold uppercase tracking-wide text-outline">Status</th>
              <th className="whitespace-nowrap px-3 pb-4 first:pl-0 last:pr-0 text-[10px] font-semibold uppercase tracking-wide text-outline">SRP (PHP)</th>
              <th className="whitespace-nowrap px-3 pb-4 first:pl-0 last:pr-0 text-[10px] font-semibold uppercase tracking-wide text-outline">Effective Date</th>
              {showActions ? (
                <th className="whitespace-nowrap px-3 pb-4 first:pl-0 last:pr-0 text-right text-[10px] font-semibold uppercase tracking-wide text-outline">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading ? (
              Array.from({ length: 5 }, (_, index) => index).map((row) => (
                <tr key={row}>
                  <td className="px-3 py-4 first:pl-0 last:pr-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-3 py-4 first:pl-0 last:pr-0">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-3 py-4 first:pl-0 last:pr-0">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-3 py-4 first:pl-0 last:pr-0">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-3 py-4 first:pl-0 last:pr-0">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  {showActions ? (
                    <td className="px-3 py-4 first:pl-0 last:pr-0 text-right">
                      <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                    </td>
                  ) : null}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columnCount} className="py-12 text-center text-sm text-error">{error}</td>
              </tr>
            ) : commodityRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="py-12 text-center text-sm text-on-surface-variant">
                  No commodities match the current filters.
                </td>
              </tr>
            ) : (
              commodityRows.map((item) => {
                const Icon = item.icon;
                return (
                  <tr
                    key={item.id}
                    // Row click is a mouse shortcut; keyboard users get the explicit
                    // history button in the Actions column instead of a tab stop per row.
                    onClick={onViewSrpHistory && !isEditingSrp ? () => onViewSrpHistory(item) : undefined}
                    className={
                      onViewSrpHistory && !isEditingSrp
                        ? "cursor-pointer transition-colors hover:bg-surface-container-low"
                        : undefined
                    }
                  >
                    <td className="px-3 py-4 first:pl-0 last:pr-0">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.iconBg}`}>
                          <Icon size={18} />
                        </div>
                        <span className="font-semibold text-on-surface">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 first:pl-0 last:pr-0 text-sm text-on-surface-variant">{item.category}</td>
                    <td className="whitespace-nowrap px-3 py-4 first:pl-0 last:pr-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.statusClass}`}>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === "Active" ? "bg-primary animate-pulse" : "bg-outline"
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-primary">
                      {srpEdit?.isEditing ? (
                        <div className="w-32">
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={srpEdit.drafts[item.id] ?? item.srpValue ?? ""}
                            placeholder="No SRP"
                            disabled={srpEdit.isSaving}
                            hasError={Boolean(srpEdit.errors[item.id])}
                            onChange={(event) => srpEdit.onDraftChange(item.id, event.target.value)}
                            aria-label={`SRP for ${item.name}`}
                          />
                          <FieldError message={srpEdit.errors[item.id]} />
                        </div>
                      ) : (
                        item.srp
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 first:pl-0 last:pr-0 text-sm text-on-surface-variant">{item.effectiveDate}</td>
                    {showActions ? (
                      <td className="px-3 py-4 first:pl-0 last:pr-0 text-right">
                        <div
                          className={`flex items-center justify-end gap-2 ${isEditingSrp ? "opacity-40" : ""}`}
                          inert={isEditingSrp}
                        >
                          {onViewSrpHistory ? (
                            <button
                              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:text-primary"
                              type="button"
                              title="View SRP history"
                              onClick={(event) => {
                                event.stopPropagation();
                                onViewSrpHistory(item);
                              }}
                            >
                              <span className="sr-only">View SRP history for {item.name}</span>
                              <MdHistory size={18} />
                            </button>
                          ) : null}
                          {onEditCommodity ? (
                            <button
                              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:text-primary"
                              type="button"
                              title="Edit commodity"
                              onClick={(event) => {
                                // Editing must not also open the history pop-up behind the dialog.
                                event.stopPropagation();
                                onEditCommodity({ id: item.id });
                              }}
                            >
                              <span className="sr-only">Edit commodity</span>
                              <MdEdit size={18} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-on-surface-variant">
          Showing {total === 0 ? 0 : `${startIndex}-${endIndex}`} of {total} commodities
        </p>
        <div className={lockBrowsing ? "opacity-60" : undefined} inert={lockBrowsing}>
          <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      </div>
    </div>
  );
}
