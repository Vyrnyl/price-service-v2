"use client";

import { ACTION_FILTER_OPTIONS } from "../constants/audit-log.constants";
import type { AuditAction } from "../types/audit-log.types";

type AuditLogFiltersProps = {
  actionFilter: AuditAction | "ALL";
  onActionFilterChange: (value: AuditAction | "ALL") => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
};

export default function AuditLogFilters({
  actionFilter,
  onActionFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: AuditLogFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 data-card-shadow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            From
            <input
              type="date"
              className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            To
            <input
              type="date"
              className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 whitespace-nowrap text-body-sm font-semibold text-on-surface">
          Filter by action:
        </span>
        {ACTION_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onActionFilterChange(option.value)}
            className={`rounded-full px-4 py-1.5 text-label-caps font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              actionFilter === option.value
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
