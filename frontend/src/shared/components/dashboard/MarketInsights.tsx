"use client";

import { useEffect, useMemo, useState } from "react";
import Input from "@/shared/components/Input";
import SearchableSelect from "@/shared/components/SearchableSelect";
import { PriceTrendLineChart } from "@/shared/components/charts/PriceTrendLineChart";
import { CommodityComparisonChart } from "@/shared/components/charts/CommodityComparisonChart";
import { SrpVsActualChart } from "@/shared/components/charts/SrpVsActualChart";
import { fetchDashboardAnalytics } from "@/shared/services/dashboard.service";
import type { DashboardAnalytics } from "@/shared/types/dashboard.types";

type RangeKey = "Week" | "Month" | "3M" | "6M" | "1Y" | "Custom";

type RangeDescriptor = {
  key: RangeKey;
  label: string;
  /** Rolling window length in days. `null` for "Custom", which uses explicit start/end dates instead. */
  days: number | null;
  description: string;
};

/**
 * Same six windows the Price Trends and Store Compliance filters offer, so a
 * range means the same thing everywhere in the app.
 */
const RANGE_DESCRIPTORS: Record<RangeKey, RangeDescriptor> = {
  Week: { key: "Week", label: "Week", days: 7, description: "over the last 7 days" },
  Month: { key: "Month", label: "Month", days: 30, description: "over the last 30 days" },
  "3M": { key: "3M", label: "3M", days: 90, description: "over the last 3 months" },
  "6M": { key: "6M", label: "6M", days: 182, description: "over the last 6 months" },
  "1Y": { key: "1Y", label: "1Y", days: 365, description: "over the last 12 months" },
  Custom: { key: "Custom", label: "Custom", days: null, description: "over the selected date range" },
};

const rangeOptions = Object.values(RANGE_DESCRIPTORS);

const ALL_COMMODITIES = "";

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * The filtered Market Insights section shared by the admin and officer
 * dashboards. Both screens showed an identical copy of these three charts
 * before this existed; keeping one component means a filter change cannot land
 * on one dashboard and quietly miss the other.
 *
 * Results are scoped server-side — an officer's dashboard reflects only their
 * own records, via the dashboard module's existing scope helper.
 */
export function MarketInsights() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeRange, setActiveRange] = useState<RangeKey>("Month");
  const today = useMemo(() => toIsoDate(new Date()), []);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState(today);
  const [selectedCommodityId, setSelectedCommodityId] = useState(ALL_COMMODITIES);

  const activeDescriptor = RANGE_DESCRIPTORS[activeRange];

  const resolvedRange = useMemo(() => {
    if (activeRange === "Custom") {
      // Wait for a start date rather than firing an unbounded request.
      return customStartDate
        ? { startDate: customStartDate, endDate: customEndDate || today }
        : null;
    }

    const start = new Date();
    start.setDate(start.getDate() - (activeDescriptor.days ?? 30));
    return { startDate: toIsoDate(start), endDate: undefined };
  }, [activeRange, activeDescriptor, customStartDate, customEndDate, today]);

  useEffect(() => {
    if (!resolvedRange) return;

    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDashboardAnalytics({
          ...resolvedRange,
          commodityId: selectedCommodityId || undefined,
        });

        if (!isMounted) return;
        setAnalytics(data);
        setError(null);

        // A commodity picked in a wide window may have no records in a narrower
        // one. Drop the selection here, where the new options are already in
        // hand, rather than leaving a filter that renders an empty trend line
        // with no explanation. The refetch this triggers returns the unfiltered
        // trend for the same range.
        if (
          selectedCommodityId &&
          !data.commodityOptions.some((option) => option.commodityId === selectedCommodityId)
        ) {
          setSelectedCommodityId(ALL_COMMODITIES);
        }
      } catch (loadError) {
        console.error("Failed to load dashboard analytics", loadError);
        if (isMounted) setError("Unable to load market insights right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [resolvedRange, selectedCommodityId]);

  const commodityOptions = analytics?.commodityOptions ?? [];

  const selectedCommodityName = commodityOptions.find(
    (option) => option.commodityId === selectedCommodityId,
  )?.commodityName;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h3 className="font-sans text-h2-desktop text-on-surface">Market Insights</h3>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((range) => (
              <button
                key={range.key}
                type="button"
                aria-pressed={activeRange === range.key}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                  activeRange === range.key
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                }`}
                onClick={() => setActiveRange(range.key)}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <SearchableSelect
              value={selectedCommodityId}
              onChange={setSelectedCommodityId}
              options={commodityOptions.map((option) => ({
                value: option.commodityId,
                label: option.commodityName,
              }))}
              placeholder="All commodities"
              searchPlaceholder="Search commodity"
              emptyLabel="No commodities in this range."
              clearLabel="All commodities"
              isLoading={isLoading}
              aria-label="Filter price trend by commodity"
            />
          </div>
        </div>
      </div>

      {activeRange === "Custom" ? (
        <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/70 bg-surface-container p-3 sm:flex-row sm:items-center sm:gap-3">
          <label className="flex flex-1 items-center gap-2 text-sm text-on-surface-variant">
            From
            <Input
              type="date"
              max={customEndDate}
              value={customStartDate}
              onChange={(event) => setCustomStartDate(event.target.value)}
              aria-label="Custom range start date"
            />
          </label>
          <label className="flex flex-1 items-center gap-2 text-sm text-on-surface-variant">
            To
            <Input
              type="date"
              min={customStartDate}
              max={today}
              value={customEndDate}
              onChange={(event) => setCustomEndDate(event.target.value)}
              aria-label="Custom range end date"
            />
          </label>
        </div>
      ) : null}

      <PriceTrendLineChart
        points={analytics?.priceTrend ?? []}
        isLoading={isLoading}
        error={error}
        subheading={
          selectedCommodityName
            ? `Average recorded price for ${selectedCommodityName}, ${activeDescriptor.description}.`
            : `Average recorded price across all commodities, ${activeDescriptor.description}.`
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <CommodityComparisonChart
          points={analytics?.commodityComparison ?? []}
          isLoading={isLoading}
          error={error}
        />
        <SrpVsActualChart
          points={analytics?.srpVsActual ?? []}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </section>
  );
}

export default MarketInsights;
