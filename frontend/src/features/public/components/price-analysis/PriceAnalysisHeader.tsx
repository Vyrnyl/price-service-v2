import { MdBarChart, MdKeyboardArrowDown, MdSearch } from "react-icons/md";

type PriceAnalysisHeaderProps = {
  selectedCommodity: string;
  isCommodityOpen: boolean;
  commoditySearch: string;
  filteredCommodities: string[];
  onToggleCommodity: () => void;
  onCommoditySearchChange: (value: string) => void;
  onSelectCommodity: (value: string) => void;
};

export function PriceAnalysisHeader({
  selectedCommodity,
  isCommodityOpen,
  commoditySearch,
  filteredCommodities,
  onToggleCommodity,
  onCommoditySearchChange,
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

      <div className="relative w-full md:w-[20rem] lg:w-[24rem]">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2.5 text-left"
          onClick={onToggleCommodity}
        >
          <span className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline">
              Commodity
            </span>
            <span className="text-sm font-semibold text-primary">{selectedCommodity || "Select commodity"}</span>
          </span>
          <MdKeyboardArrowDown className={`transition-transform ${isCommodityOpen ? "rotate-180" : ""}`} />
        </button>

        {isCommodityOpen ? (
          <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-2 data-card-shadow">
            <div className="relative mb-2">
              <MdSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={commoditySearch}
                onChange={(event) => onCommoditySearchChange(event.target.value)}
                placeholder="Search commodity"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-high py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filteredCommodities.length > 0 ? (
                filteredCommodities.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      selectedCommodity === option
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface hover:bg-surface-container-high"
                    }`}
                    onClick={() => onSelectCommodity(option)}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-on-surface-variant">No commodities found.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
