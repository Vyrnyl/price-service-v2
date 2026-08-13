"use client";

import { MdOutlineSearch } from "react-icons/md";
import type { UserRole } from "../types/users.types";

type UsersSearchFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: "ALL" | UserRole;
  onRoleFilterChange: (value: "ALL" | UserRole) => void;
  showActiveOnly: boolean;
  onActiveFilterChange: (value: boolean) => void;
};

export default function UsersSearchFilters({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  showActiveOnly,
  onActiveFilterChange,
}: UsersSearchFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:w-96">
        <MdOutlineSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          size={20}
        />
        <input
          className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-body-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Search by name, email or role..."
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
        <span className="mr-1 whitespace-nowrap text-body-sm font-semibold text-on-surface">
          Filter by:
        </span>
        <button
          type="button"
          onClick={() => onRoleFilterChange("ALL")}
          className={`rounded-full px-4 py-1.5 text-label-caps font-semibold transition-colors ${
            roleFilter === "ALL"
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          All Roles
        </button>
        <button
          type="button"
          onClick={() => onRoleFilterChange("ADMIN")}
          className={`rounded-full px-4 py-1.5 text-label-caps font-medium transition-colors ${
            roleFilter === "ADMIN"
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => onRoleFilterChange("OFFICER")}
          className={`rounded-full px-4 py-1.5 text-label-caps font-medium transition-colors ${
            roleFilter === "OFFICER"
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          Officer
        </button>
        <button
          type="button"
          onClick={() => onActiveFilterChange(!showActiveOnly)}
          className={`rounded-full px-4 py-1.5 text-label-caps font-medium transition-colors ${
            showActiveOnly
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          Active Only
        </button>
      </div>
    </div>
  );
}
