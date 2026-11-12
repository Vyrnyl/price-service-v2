import FormGroup from "@/shared/components/FormGroup";
import Select from "@/shared/components/Select";
import SearchableSelect from "@/shared/components/SearchableSelect";
import type { CommodityOption, StoreOption } from "../types/price-record.types";

interface PriceRecordFiltersProps {
  storeFilter: string;
  /** Category id, or "" for all categories. */
  categoryFilter: string;
  commodityFilter: string;
  onStoreChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCommodityChange: (value: string) => void;
  stores: StoreOption[];
  categoryOptions: { value: string; label: string }[];
  /** Already narrowed to the selected category by the caller. */
  commodities: CommodityOption[];
  commodityOptionsLoading?: boolean;
}

export default function PriceRecordFilters({
  storeFilter,
  categoryFilter,
  commodityFilter,
  onStoreChange,
  onCategoryChange,
  onCommodityChange,
  stores,
  categoryOptions,
  commodities,
  commodityOptionsLoading = false,
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
          <FormGroup label="Category" htmlFor="price-record-category-filter">
            <SearchableSelect
              id="price-record-category-filter"
              value={categoryFilter}
              onChange={onCategoryChange}
              options={categoryOptions}
              placeholder="All categories"
              searchPlaceholder="Search category"
              emptyLabel="No categories found."
              clearLabel="All categories"
              isLoading={commodityOptionsLoading}
              aria-label="Filter by category"
            />
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
              isLoading={commodityOptionsLoading}
              aria-label="Filter by commodity"
            />
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
