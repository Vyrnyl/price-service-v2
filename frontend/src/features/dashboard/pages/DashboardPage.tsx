"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  MdStorefront,
  MdTrendingUp,
} from "react-icons/md";
import { getPublicCommodities, type PublicCommodityItem } from "@/features/commodity";
import PageShell from "@/shared/components/PageShell";
import HeroSection from "../components/HeroSection";
import SummaryStats from "../components/SummaryStats";

interface RecentSrpUpdate {
  name: string;
  srp: string;
  updated: string;
}

interface MarketHighlight {
  title: string;
  value: string;
  note: string;
}

function formatCurrency(value: number | null) {
  if (value == null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRelativeTime(value: string | null) {
  if (!value) {
    return "Recently updated";
  }

  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) {
    return "Recently updated";
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - updatedAt.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `Updated ${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function getMarketHighlights(commodities: PublicCommodityItem[]): MarketHighlight[] {
  const commodityCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();

  commodities.forEach((commodity) => {
    const name = commodity.name?.trim();
    if (name) {
      commodityCounts.set(name, (commodityCounts.get(name) ?? 0) + 1);
    }

    const location = commodity.storeLocation?.trim();
    if (location) {
      locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
    }
  });

  const highestDemandEntry = [...commodityCounts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  )[0];

  const mostActiveAreaEntry = [...locationCounts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  )[0];

  const bestValueSpotEntry = (() => {
    if (!highestDemandEntry?.[0]) {
      return undefined;
    }

    const storePriceTotals = new Map<string, { total: number; count: number }>();
    commodities
      .filter((commodity) => commodity.name?.trim() === highestDemandEntry[0])
      .forEach((commodity) => {
        if (commodity.storeName && commodity.currentPrice != null) {
          const existing = storePriceTotals.get(commodity.storeName) ?? { total: 0, count: 0 };
          storePriceTotals.set(commodity.storeName, {
            total: existing.total + commodity.currentPrice,
            count: existing.count + 1,
          });
        }
      });

    return [...storePriceTotals.entries()].sort((left, right) => {
      const leftAverage = left[1].total / left[1].count;
      const rightAverage = right[1].total / right[1].count;

      return leftAverage - rightAverage || left[0].localeCompare(right[0]);
    })[0];
  })();

  return [
    {
      title: "Highest demand item",
      value: highestDemandEntry?.[0] ?? "No data",
      note: highestDemandEntry
        ? `${highestDemandEntry[1]} listed record${highestDemandEntry[1] === 1 ? "" : "s"} in the latest feed`
        : "No commodity data available",
    },
    {
      title: "Most active area",
      value: mostActiveAreaEntry?.[0] ?? "No data",
      note: mostActiveAreaEntry
        ? `${mostActiveAreaEntry[1]} recent update${mostActiveAreaEntry[1] === 1 ? "" : "s"} from this area`
        : "No location data available",
    },
    {
      title: "Best value spot",
      value: bestValueSpotEntry?.[0] ?? "No data",
      note: bestValueSpotEntry
        ? `Avg ${formatCurrency(bestValueSpotEntry[1].total / bestValueSpotEntry[1].count)} for ${highestDemandEntry?.[0] ?? "this commodity"}`
        : "No store pricing available",
    },
  ];
}

export default function DashboardPage() {
  const [recentSrpUpdates, setRecentSrpUpdates] = useState<RecentSrpUpdate[]>([]);
  const [marketHighlights, setMarketHighlights] = useState<MarketHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRecentUpdates() {
      try {
        const commodities = await getPublicCommodities();

        if (!isMounted) {
          return;
        }

        const mappedUpdates = commodities
          .slice()
          .sort((left, right) => {
            const leftTime = left.lastUpdatedAt ? new Date(left.lastUpdatedAt).getTime() : 0;
            const rightTime = right.lastUpdatedAt ? new Date(right.lastUpdatedAt).getTime() : 0;
            return rightTime - leftTime;
          })
          .slice(0, 5)
          .map((commodity: PublicCommodityItem) => ({
            name: commodity.name,
            srp: formatCurrency(commodity.srpPrice),
            updated: formatRelativeTime(commodity.lastUpdatedAt),
          }));

        setRecentSrpUpdates(mappedUpdates);
        setMarketHighlights(getMarketHighlights(commodities));
      } catch {
        if (isMounted) {
          setRecentSrpUpdates([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecentUpdates();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PageShell>
      <HeroSection />
      <SummaryStats />

      <section className="px-container-margin-mobile py-12 md:px-container-margin-desktop">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-sans text-h3-desktop text-on-surface">
                  Recent SRP updates
                </h3>
                <p className="mt-1 font-sans text-on-surface-variant">
                  A quick look at the latest SRP-related commodity updates and their current status.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  Loading recent updates...
                </div>
              ) : recentSrpUpdates.length > 0 ? (
                recentSrpUpdates.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-sans font-semibold text-on-surface">{item.name}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{item.updated}</p>
                    </div>

                    <div className="text-right">
                      <p className="mt-1 font-sans text-h3-desktop text-on-surface">
                        {item.srp}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  No recent SRP updates available right now.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 data-card-shadow">
              <div className="mb-4 flex items-center gap-2">
                <MdTrendingUp className="text-primary" size={22} />
                <h3 className="font-sans text-h3-desktop text-on-surface">
                  Market highlights
                </h3>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                    Loading market highlights...
                  </div>
                ) : marketHighlights.length > 0 ? (
                  marketHighlights.map((item) => (
                    <div key={item.title} className="rounded-xl bg-surface-container-lowest p-4">
                      <p className="font-sans text-label-caps text-on-surface-variant">
                        {item.title}
                      </p>
                      <p className="mt-1 font-sans text-h3-desktop text-on-surface">
                        {item.value}
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">{item.note}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                    No market highlights available right now.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-primary-container/20 p-6 data-card-shadow">
              <div className="mb-3 flex items-center gap-2">
                <MdStorefront className="text-primary" size={22} />
                <h3 className="font-sans text-h3-desktop text-on-surface">
                  Helpful for shoppers
                </h3>
              </div>
              <p className="font-sans text-on-surface-variant">
                Compare nearby stores, review recent price updates, and quickly see whether a commodity is aligned with the current SRP guidance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
