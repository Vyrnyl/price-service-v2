import { MdSearch } from "react-icons/md";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import { STATUS_FILTER_OPTIONS, STORE_FILTER_OPTIONS } from "../constants/stores.constants";

interface StoreRegistryToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  municipalityFilter: string;
  onMunicipalityFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  storeCount: number;
}

export function StoreRegistryToolbar({
  searchTerm,
  onSearchChange,
  municipalityFilter,
  onMunicipalityFilterChange,
  statusFilter,
  onStatusFilterChange,
  storeCount,
}: StoreRegistryToolbarProps) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          icon={<MdSearch size={20} />}
          placeholder="Search store name, location, or officer..."
          aria-label="Search stores"
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <Select
          value={municipalityFilter}
          onChange={(event) => onMunicipalityFilterChange(event.target.value)}
          aria-label="Filter by municipality"
        >
          {STORE_FILTER_OPTIONS.map((option) => {
            const value = option === "All Municipalities" ? "" : option;
            return (
              <option key={option} value={value}>
                {option}
              </option>
            );
          })}
        </Select>

        <Select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          aria-label="Filter by status"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 text-sm text-on-surface-variant">
        Showing {storeCount} result{storeCount === 1 ? "" : "s"}.
      </div>
    </div>
  );
}
