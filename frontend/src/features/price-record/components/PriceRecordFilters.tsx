import type { CommodityOption, StoreOption } from "../types/price-record.types";

interface PriceRecordFiltersProps {
  search: string;
  storeFilter: string;
  commodityFilter: string;
  onSearchChange: (value: string) => void;
  onStoreChange: (value: string) => void;
  onCommodityChange: (value: string) => void;
  stores: StoreOption[];
  commodities: CommodityOption[];
}

export default function PriceRecordFilters({
  search,
  storeFilter,
  commodityFilter,
  onSearchChange,
  onStoreChange,
  onCommodityChange,
  stores,
  commodities,
}: PriceRecordFiltersProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 data-card-shadow md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-h3-desktop text-h3-desktop text-on-surface">Search & Filters</h2>
          <p className="text-body-xs text-on-surface-variant">Narrow the list by store, commodity, or record ID.</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-surface-container-low py-1.5 px-2.5 text-body-xs text-on-surface-variant">
          Quick filters
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="block text-body-sm font-medium text-on-surface">Search</label>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder="Search by store, commodity, or ID"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-body-sm font-medium text-on-surface">Store</label>
          <select
            value={storeFilter}
            onChange={(event) => onStoreChange(event.target.value)}
            className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="">All stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-body-sm font-medium text-on-surface">Commodity</label>
          <select
            value={commodityFilter}
            onChange={(event) => onCommodityChange(event.target.value)}
            className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="">All commodities</option>
            {commodities.map((commodity) => (
              <option key={commodity.id} value={commodity.id}>
                {commodity.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
