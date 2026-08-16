"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineCategory,
  MdOutlineStoreMallDirectory,
  MdOutlineUpdate,
} from "react-icons/md";
import { getPublicCommodities, type PublicCommodityItem } from "@/features/commodity";

interface SummaryState {
  commodityCount: number;
  storeCount: number;
  updatesLast24Hours: number;
}

const initialSummaryState: SummaryState = {
  commodityCount: 0,
  storeCount: 0,
  updatesLast24Hours: 0,
};

function formatValue(value: number) {
  return value.toLocaleString("en-US");
}

export default function SummaryStats() {
  const [summary, setSummary] = useState<SummaryState>(initialSummaryState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const commodities = await getPublicCommodities();

        if (!isMounted) {
          return;
        }

        const now = new Date();
        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const stores = new Set<string>();
        let updatesLast24Hours = 0;

        commodities.forEach((commodity: PublicCommodityItem) => {
          if (commodity.storeName) {
            stores.add(commodity.storeName);
          }

          if (commodity.lastUpdatedAt) {
            const updatedAt = new Date(commodity.lastUpdatedAt);
            if (!Number.isNaN(updatedAt.getTime()) && updatedAt >= cutoff) {
              updatesLast24Hours += 1;
            }
          }
        });

        setSummary({
          commodityCount: commodities.length,
          storeCount: stores.size,
          updatesLast24Hours,
        });
      } catch {
        if (isMounted) {
          setSummary(initialSummaryState);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        icon: MdOutlineCategory,
        label: "Total Commodities",
        value: isLoading ? "—" : formatValue(summary.commodityCount),
        meta: "LATEST",
        iconClass: "text-primary",
      },
      {
        icon: MdOutlineStoreMallDirectory,
        label: "Stores Monitored",
        value: isLoading ? "—" : formatValue(summary.storeCount),
        meta: "LIVE",
        iconClass: "text-primary",
      },
      {
        icon: MdOutlineUpdate,
        label: "Price Updates Today",
        value: isLoading ? "—" : formatValue(summary.updatesLast24Hours),
        meta: "LAST 24H",
        iconClass: "text-primary",
      },
    ],
    [isLoading, summary.commodityCount, summary.storeCount, summary.updatesLast24Hours],
  );

  return (
    <section className="bg-surface-container-low px-container-margin-mobile py-12 md:px-container-margin-desktop">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h3 className="font-sans text-h3-desktop text-on-surface">
            Quick summary
          </h3>
          <p className="mt-1 font-sans text-on-surface-variant">
            A quick overview of the latest market activity and monitored coverage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="animate-stats rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className={`rounded-lg bg-primary/10 p-2 ${stat.iconClass}`}>
                    <Icon size={22} />
                  </span>
                  <span
                    className={`text-xs font-sans ${
                      stat.meta === "HIGH COMPLIANCE"
                        ? "text-success"
                        : "text-outline"
                    }`}
                  >
                    {stat.meta}
                  </span>
                </div>
                <div className="mb-1 font-sans text-[32px] text-on-surface">
                  {stat.value}
                </div>
                <div className="font-sans text-label-caps text-on-surface-variant">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
