import { MdSearch } from "react-icons/md";
import { STATUS_CHIPS, STATUS_FILTER_OPTIONS, STORE_FILTER_OPTIONS } from "../constants/stores.constants";

interface StoreRegistryToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  municipalityFilter: string;
  onMunicipalityFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  quickFilter: string;
  onQuickFilterChange: (value: string) => void;
  storeCount: number;
}

export function StoreRegistryToolbar({
  searchTerm,
  onSearchChange,
  municipalityFilter,
  onMunicipalityFilterChange,
  statusFilter,
  onStatusFilterChange,
  quickFilter,
  onQuickFilterChange,
  storeCount,
}: StoreRegistryToolbarProps) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow">
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
        <div className="relative md:col-span-6">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input
            className="w-full rounded-xl border-none bg-surface-container-low py-3 pl-12 pr-4 text-body-sm placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary"
            placeholder="Search store name, location, or officer..."
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="md:col-span-3">
          <select
            className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-body-sm focus:ring-2 focus:ring-primary"
            value={municipalityFilter}
            onChange={(event) => onMunicipalityFilterChange(event.target.value)}
          >
            {STORE_FILTER_OPTIONS.map((option) => {
              const value = option === "All Municipalities" ? "" : option;
              return (
                <option key={option} value={value}>
                  {option}
                </option>
              );
            })}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            className="w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-body-sm focus:ring-2 focus:ring-primary"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="mr-2 whitespace-nowrap font-sans text-label-caps text-on-surface-variant">Quick Filter:</span>
        {STATUS_CHIPS.map((chip) => {
          const isActive = quickFilter === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => onQuickFilterChange(chip)}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-body-sm transition-colors ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-on-surface-variant">
        Showing {storeCount} result{storeCount === 1 ? "" : "s"}.
      </div>
    </div>
  );
}
