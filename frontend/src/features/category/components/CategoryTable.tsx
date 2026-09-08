"use client";

import { MdEdit, MdDeleteOutline, MdKitchen, MdSearch } from "react-icons/md";
import Pagination from "@/shared/components/Pagination";
import Skeleton from "@/shared/components/Skeleton";
import type { CategoryItem } from "../services/category.api";

const PAGE_SIZE = 8;

type CategoryTableProps = {
  categoryRows: CategoryItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  currentPage: number;
  canManage: boolean;
  onSearchTermChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEditCategory?: (category: CategoryItem) => void;
  onDeleteCategory?: (category: CategoryItem) => void;
};

export default function CategoryTable({
  categoryRows,
  total,
  isLoading,
  error,
  searchTerm,
  currentPage,
  canManage,
  onSearchTermChange,
  onPageChange,
  onEditCategory,
  onDeleteCategory,
}: CategoryTableProps) {
  const columnCount = canManage ? 3 : 2;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = total === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(startIndex + categoryRows.length - 1, total);

  return (
    <div className="flex min-h-105 flex-1 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h4 className="font-sans text-h3-desktop text-on-surface">Categories</h4>
          <p className="text-body-sm text-on-surface-variant">
            Reference categories used by the Add Commodity form
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <div className="relative w-full">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input
            className="w-full rounded-xl border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-body-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Search categories..."
            aria-label="Search categories"
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="pb-4 text-[10px] font-semibold uppercase tracking-wide text-outline">Category</th>
              <th className="pb-4 text-[10px] font-semibold uppercase tracking-wide text-outline">Commodities</th>
              {canManage ? (
                <th className="pb-4 text-right text-[10px] font-semibold uppercase tracking-wide text-outline">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading ? (
              Array.from({ length: 5 }, (_, index) => index).map((row) => (
                <tr key={row}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="py-4">
                    <Skeleton className="h-4 w-10" />
                  </td>
                  {canManage ? (
                    <td className="py-4 text-right">
                      <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                    </td>
                  ) : null}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columnCount} className="py-12 text-center text-sm text-error">{error}</td>
              </tr>
            ) : categoryRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="py-12 text-center text-sm text-on-surface-variant">
                  No categories match the current search.
                </td>
              </tr>
            ) : (
              categoryRows.map((category) => (
                <tr key={category.id}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-container/10 text-secondary">
                        <MdKitchen size={18} />
                      </div>
                      <span className="font-semibold text-on-surface">{category.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-on-surface-variant">{category.commodityCount}</td>
                  {canManage ? (
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          type="button"
                          title="Edit category"
                          onClick={() => onEditCategory?.(category)}
                        >
                          <span className="sr-only">Edit category</span>
                          <MdEdit size={18} />
                        </button>
                        <button
                          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          type="button"
                          title="Delete category"
                          onClick={() => onDeleteCategory?.(category)}
                        >
                          <span className="sr-only">Delete category</span>
                          <MdDeleteOutline size={18} />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-on-surface-variant">
          Showing {total === 0 ? 0 : `${startIndex}-${endIndex}`} of {total} categories
        </p>
        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
