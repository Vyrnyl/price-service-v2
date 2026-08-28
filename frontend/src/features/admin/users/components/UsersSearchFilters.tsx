"use client";

import { MdOutlineSearch } from "react-icons/md";
import Chip from "@/shared/components/Chip";
import Input from "@/shared/components/Input";
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
    <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 data-card-shadow lg:flex-row lg:items-center lg:justify-between">
      <div className="w-full lg:w-96">
        <Input
          icon={<MdOutlineSearch size={20} />}
          placeholder="Search by name, email or role..."
          aria-label="Search users"
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
        <span className="mr-1 whitespace-nowrap text-body-sm font-semibold text-on-surface">
          Filter by:
        </span>
        <Chip active={roleFilter === "ALL"} onClick={() => onRoleFilterChange("ALL")}>
          All Roles
        </Chip>
        <Chip active={roleFilter === "ADMIN"} onClick={() => onRoleFilterChange("ADMIN")}>
          Admin
        </Chip>
        <Chip active={roleFilter === "OFFICER"} onClick={() => onRoleFilterChange("OFFICER")}>
          Officer
        </Chip>
        <Chip active={showActiveOnly} onClick={() => onActiveFilterChange(!showActiveOnly)}>
          Active Only
        </Chip>
      </div>
    </div>
  );
}
