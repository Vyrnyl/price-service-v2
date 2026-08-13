"use client";

import { MdEdit, MdOutlineChevronLeft, MdOutlineChevronRight, MdSearch } from "react-icons/md";
import type { ComponentType } from "react";
import type { CommodityItem } from "../services/commodity.api";
import type { CommodityStatus } from "../commodity.schema";

export type CommodityRow = {
  id: string;
  name: string;
  category: string;
  status: CommodityStatus;
  srp: string;
  statusClass: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
};

type CommodityTableProps = {
  commodityRows: CommodityRow[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: "ALL" | "Active" | "Inactive";
  currentPage: number;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: "ALL" | "Active" | "Inactive") => void;
  onPageChange: (page: number) => void;
  onOpenUpdateSrp?: (commodityId: string) => void;
  onEditCommodity?: (commodity: Pick<CommodityItem, "id" | "name" | "category" | "status">) => void;
};

export default function CommodityTable({
  commodityRows,
  isLoading,
  error,
  searchTerm,
  statusFilter,
  currentPage,
  onSearchTermChange,
  onStatusFilterChange,
  onPageChange,
  onOpenUpdateSrp,
  onEditCommodity,
}: CommodityTableProps) {
  const showActions = Boolean(onOpenUpdateSrp || onEditCommodity);
  const columnCount = showActions ? 5 : 4;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredCommodityRows = commodityRows.filter((row) => {
    const normalizedRow = `${row.name} ${row.category} ${row.status}`.toLowerCase();
    const matchesSearch = normalizedRow.includes(normalizedSearchTerm);
    const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredCommodityRows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCommodityRows = filteredCommodityRows.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    (safeCurrentPage - 1) * PAGE_SIZE + PAGE_SIZE,
  );

  const startIndex = filteredCommodityRows.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(startIndex + paginatedCommodityRows.length - 1, filteredCommodityRows.length);

  return (
    <div className="flex min-h-105 flex-1 flex-col rounded-3xl border border-outline-variant bg-white p-6 data-card-shadow md:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h4 className="font-h3-desktop text-h3-desktop text-on-surface">Commodity with SRP</h4>
          <p className="text-body-sm text-on-surface-variant">
            Active market listings and monitoring status
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        <div className="relative w-full">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input
            className="w-full rounded-xl border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-body-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Filter by commodity name, category, or status..."
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
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

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="pb-4 text-[10px] font-semibold uppercase tracking-wide text-outline">Commodity</th>
              <th className="pb-4 text-[10px] font-semibold uppercase tracking-wide text-outline">Category</th>
              <th className="pb-4 text-[10px] font-semibold uppercase tracking-wide text-outline">Status</th>
              <th className="pb-4 text-[10px] font-semibold uppercase tracking-wide text-outline">SRP (PHP)</th>
              {showActions ? (
                <th className="pb-4 text-right text-[10px] font-semibold uppercase tracking-wide text-outline">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-on-surface-variant">
                  Loading commodities...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-error">{error}</td>
              </tr>
            ) : filteredCommodityRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-on-surface-variant">
                  No commodities match the current filters.
                </td>
              </tr>
            ) : (
              paginatedCommodityRows.map((item) => {
                const Icon = item.icon;
                return (
                  <tr key={item.id}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.iconBg}`}>
                          <Icon size={18} />
                        </div>
                        <span className="font-semibold text-on-surface">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-on-surface-variant">{item.category}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.statusClass}`}>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === "Active" ? "bg-primary animate-pulse" : "bg-outline"
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm font-semibold text-primary">{item.srp}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onOpenUpdateSrp ? (
                          <button
                            className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface transition hover:border-primary hover:text-primary"
                            type="button"
                            title="Update SRP"
                            onClick={() => onOpenUpdateSrp(item.id)}
                          >
                            Update SRP
                          </button>
                        ) : null}
                        {onEditCommodity ? (
                          <button
                            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:text-primary"
                            type="button"
                            title="Edit commodity"
                            onClick={() =>
                              onEditCommodity({
                                id: item.id,
                                name: item.name,
                                category: item.category,
                                status: item.status,
                              })
                            }
                          >
                            <span className="sr-only">Edit commodity</span>
                            <MdEdit size={18} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-on-surface-variant">
          Showing {filteredCommodityRows.length === 0 ? 0 : `${startIndex}-${endIndex}`} of {filteredCommodityRows.length} commodities
        </p>
        <div className="flex items-center gap-1">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-outline transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
            disabled={safeCurrentPage === 1}
            onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          >
            <MdOutlineChevronLeft size={20} />
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                safeCurrentPage === page
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-outline transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
            disabled={safeCurrentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          >
            <MdOutlineChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
