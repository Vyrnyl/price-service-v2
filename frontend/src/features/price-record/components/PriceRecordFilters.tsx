import FormGroup from "@/shared/components/FormGroup";
import Select from "@/shared/components/Select";
import SearchableSelect from "@/shared/components/SearchableSelect";
import type { CommodityOption, StoreOption } from "../types/price-record.types";

interface PriceRecordFiltersProps {
  storeFilter: string;
  commodityFilter: string;
  onStoreChange: (value: string) => void;
  onCommodityChange: (value: string) => void;
  stores: StoreOption[];
  commodities: CommodityOption[];
}

export default function PriceRecordFilters({
  storeFilter,
  commodityFilter,
  onStoreChange,
  onCommodityChange,
  stores,
  commodities,
}: PriceRecordFiltersProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 data-card-shadow">
      <h2 className="font-sans text-h3-desktop text-on-surface">Filters</h2>

      <div className="flex flex-wrap gap-4">
        <div className="w-full max-w-80">
          <FormGroup label="Store" htmlFor="price-record-store-filter">
            <Select
              id="price-record-store-filter"
              value={storeFilter}
              onChange={(event) => onStoreChange(event.target.value)}
            >
              <option value="">All stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Select>
          </FormGroup>
        </div>

        <div className="w-full max-w-80">
          <FormGroup label="Commodity" htmlFor="price-record-commodity-filter">
            <SearchableSelect
              value={commodityFilter}
              onChange={onCommodityChange}
              options={commodities.map((commodity) => ({ value: commodity.id, label: commodity.name }))}
              placeholder="All commodities"
              searchPlaceholder="Search commodity"
              emptyLabel="No commodities found."
              clearLabel="All commodities"
              aria-label="Filter by commodity"
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
