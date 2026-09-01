import { MdBarChart } from "react-icons/md";
import SearchableSelect from "@/shared/components/SearchableSelect";

type PriceAnalysisHeaderProps = {
  selectedCommodity: string;
  commodityOptions: string[];
  onSelectCommodity: (value: string) => void;
};

export function PriceAnalysisHeader({
  selectedCommodity,
  commodityOptions,
  onSelectCommodity,
}: PriceAnalysisHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 data-card-shadow sm:p-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary sm:text-[11px]">
          <MdBarChart size={14} />
          Public price analysis
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl md:text-4xl">
          Price trends and forecasts
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant md:text-base">
          Follow essential commodity movements, understand current compliance, and review the latest outlook for the market.
        </p>
      </div>

      <div className="w-full md:w-[20rem] lg:w-[24rem]">
        <SearchableSelect
          value={selectedCommodity}
          onChange={onSelectCommodity}
          options={commodityOptions.map((name) => ({ value: name, label: name }))}
          placeholder="Select commodity"
          searchPlaceholder="Search commodity"
          emptyLabel="No commodities found."
          aria-label="Select commodity"
        />
      </div>
    </div>
  );
}
