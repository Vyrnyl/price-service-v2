"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/shared/components/PageShell";
import Input from "@/shared/components/Input";
import { StoreViolationsChart } from "@/shared/components/charts/StoreViolationsChart";
import { StoreViolationsTable } from "../components/StoreViolationsTable";
import { fetchStoreViolations } from "@/shared/services/dashboard.service";
import type { StoreViolationPoint } from "@/shared/types/dashboard.types";

type RangeKey = "Week" | "Month" | "3M" | "6M" | "1Y" | "Custom";

type RangeDescriptor = {
  key: RangeKey;
  label: string;
  /** Rolling window length in days. `null` for "Custom", which uses explicit start/end dates instead. */
  days: number | null;
  description: string;
};

const RANGE_DESCRIPTORS: Record<RangeKey, RangeDescriptor> = {
  Week: { key: "Week", label: "Week", days: 7, description: "over the last 7 days" },
  Month: { key: "Month", label: "Month", days: 30, description: "over the last 30 days" },
  "3M": { key: "3M", label: "3M", days: 90, description: "over the last 3 months" },
  "6M": { key: "6M", label: "6M", days: 182, description: "over the last 6 months" },
  "1Y": { key: "1Y", label: "1Y", days: 365, description: "over the last 12 months" },
  Custom: { key: "Custom", label: "Custom", days: null, description: "over the selected date range" },
};

const rangeOptions = Object.values(RANGE_DESCRIPTORS);

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function StoreComplianceOverviewPage() {
  const [points, setPoints] = useState<StoreViolationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<RangeKey>("Month");
  const today = useMemo(() => toIsoDate(new Date()), []);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState(today);

  const activeDescriptor = RANGE_DESCRIPTORS[activeRange];

  const resolvedRange = useMemo(() => {
    if (activeRange === "Custom") {
      return customStartDate
        ? { startDate: customStartDate, endDate: customEndDate || today }
        : null;
    }

    const start = new Date();
    start.setDate(start.getDate() - (activeDescriptor.days ?? 30));
    return { startDate: toIsoDate(start), endDate: undefined };
  }, [activeRange, activeDescriptor, customStartDate, customEndDate, today]);

  useEffect(() => {
    if (!resolvedRange) {
      // Custom range selected but no start date chosen yet — wait for input.
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchStoreViolations(resolvedRange);
        if (isMounted) {
          setPoints(data);
          setError(null);
        }
      } catch (loadError) {
        console.error("Failed to load store violations", loadError);
        if (isMounted) {
          setError("Unable to load store compliance data right now.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [resolvedRange]);

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-8 sm:py-10 md:px-container-margin-desktop md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-sans text-h1-desktop text-on-surface mobile:font-sans mobile:text-h1-mobile">
                Store Compliance
              </h1>
              <p className="mt-1 text-body-lg text-on-surface-variant">
                Which stores have priced commodities above their Suggested Retail Price {activeDescriptor.description}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {rangeOptions.map((range) => (
                <button
                  key={range.key}
                  type="button"
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

          <StoreViolationsChart
            points={points}
            isLoading={isLoading}
            error={error}
            rangeDescription={activeDescriptor.description}
          />
          <StoreViolationsTable points={points} isLoading={isLoading} error={error} />
        </div>
      </section>
    </PageShell>
  );
}
