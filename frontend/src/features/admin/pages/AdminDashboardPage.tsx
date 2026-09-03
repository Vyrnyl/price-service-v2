"use client";

import { useEffect, useState, type ComponentType } from "react";
import { apiFetch, fetchAllPages } from "../../../shared/services/api";
import { MdOutlineInventory2, MdOutlineTrendingUp, MdOutlineStorefront } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { IoFilterOutline } from "react-icons/io5";
import { IoMdAdd } from "react-icons/io";
import { LuDownload } from "react-icons/lu";
import { PriceTrendLineChart } from "@/shared/components/charts/PriceTrendLineChart";
import { CommodityComparisonChart } from "@/shared/components/charts/CommodityComparisonChart";
import { SrpVsActualChart } from "@/shared/components/charts/SrpVsActualChart";
import { fetchDashboardAnalytics } from "@/shared/services/dashboard.service";
import type { DashboardAnalytics } from "@/shared/types/dashboard.types";
import PageShell from "@/shared/components/PageShell";
import Skeleton, { SkeletonStatCard } from "@/shared/components/Skeleton";

type DashboardStat = {
  label: string;
  value: string;
  meta?: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  metaStyle?: string;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  timestamp: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  iconStyle: string;
  change?: string;
};

type RecentStoreRow = {
  id: string;
  name: string;
  location: string;
  officerName: string;
  createdAt: string;
};

const initialStats: DashboardStat[] = [
  {
    label: "Total Commodities",
    value: "—",
    meta: "Loading...",
    icon: MdOutlineInventory2,
    iconBg: "bg-primary-container/10",
    iconColor: "text-primary",
  },
  {
    label: "Monitored Prices",
    value: "—",
    meta: "Loading...",
    icon: MdOutlineTrendingUp,
    iconBg: "bg-tertiary-container/10",
    iconColor: "text-tertiary",
  },
  {
    label: "Total Stores",
    value: "—",
    meta: "Loading...",
    icon: MdOutlineStorefront,
    iconBg: "bg-secondary-container/10",
    iconColor: "text-secondary",
  },
  {
    label: "Total Users",
    value: "—",
    meta: "Loading...",
    icon: FiUsers,
    iconBg: "bg-outline-variant/20",
    iconColor: "text-on-surface-variant",
  },
];

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStat[]>(initialStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [recentStores, setRecentStores] = useState<RecentStoreRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);
        const data = await fetchDashboardAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load dashboard analytics", error);
        setAnalyticsError("Unable to load market insights right now.");
      } finally {
        setAnalyticsLoading(false);
      }
    }

    void loadAnalytics();
  }, []);

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        setStatsLoading(true);
        const [commodityResponse, storeResponse, userResponse] = await Promise.all([
          apiFetch<{ status: string; data: unknown[]; total: number }>('/api/commodities?pageSize=1'),
          apiFetch<{ status: string; data: unknown[]; total: number }>('/api/stores?pageSize=1'),
          apiFetch<{ status: string; data: unknown[]; total: number }>('/api/users?pageSize=1'),
        ]);

        const totalCommodities = String(commodityResponse.total);
        const totalStores = String(storeResponse.total);
        const totalUsers = String(userResponse.total);
        const monitoredPrices = String(0);

        setStats([
          {
            label: "Total Commodities",
            value: totalCommodities,
            meta: `${totalCommodities} tracked`,
            icon: MdOutlineInventory2,
            iconBg: "bg-primary-container/10",
            iconColor: "text-primary",
          },
          {
            label: "Total Stores",
            value: totalStores,
            meta: "Monitored locations",
            icon: MdOutlineStorefront,
            iconBg: "bg-secondary-container/10",
            iconColor: "text-secondary",
          },
          {
            label: "Total Users",
            value: totalUsers,
            meta: "Active accounts",
            icon: FiUsers,
            iconBg: "bg-outline-variant/20",
            iconColor: "text-on-surface-variant",
          },
        ]);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setStatsLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  useEffect(() => {
    async function loadActivityAndRecentStores() {
      try {
        setRecentLoading(true);
        type StoreListItem = { id: string; name: string; location?: string; createdAt?: string; user?: { name?: string } };

        // Stores are fetched once here and reused for both the activity feed and the
        // "Recently Added Stores" table — these used to be two separate effects that
        // each walked the full store list independently, doubling the request count.
        const storesData = await fetchAllPages<StoreListItem>("/api/stores");
        const [commoditiesData, priceRecordsResponse] = await Promise.all([
          fetchAllPages<{ id: string; name: string; createdAt?: string }>("/api/commodities"),
          apiFetch<{ status: string; data: Array<{ id: string; commodity?: { name?: string }; store?: { name?: string }; price?: number | string; createdAt?: string; dateAndTime?: string }> }>("/api/price-records?pageSize=20"),
        ]);

        const nextItems: ActivityItem[] = [
          ...storesData.map((store) => ({
            id: `store-${store.id}`,
            icon: MdOutlineStorefront,
            iconStyle: "bg-secondary-container text-on-secondary-container",
            title: "New store added",
            description: `${store.name} was added in ${store.location ?? "the system"}`,
            time: formatRelativeTime(store.createdAt ?? new Date().toISOString()),
            timestamp: store.createdAt ?? new Date().toISOString(),
          })),
          ...commoditiesData.map((commodity) => ({
            id: `commodity-${commodity.id}`,
            icon: MdOutlineInventory2,
            iconStyle: "bg-secondary-container text-on-secondary-container",
            title: "Commodity added",
            description: `${commodity.name} was added to the system`,
            time: formatRelativeTime(commodity.createdAt ?? new Date().toISOString()),
            timestamp: commodity.createdAt ?? new Date().toISOString(),
          })),
          ...priceRecordsResponse.data.map((record) => ({
            id: `price-record-${record.id}`,
            icon: MdOutlineTrendingUp,
            iconStyle: "bg-tertiary-container/10 text-tertiary",
            title: "Price record added",
            description: `${record.commodity?.name ?? "Commodity"} at ${record.store?.name ?? "a store"} was recorded`,
            time: formatRelativeTime(record.dateAndTime ?? record.createdAt ?? new Date().toISOString()),
            timestamp: record.dateAndTime ?? record.createdAt ?? new Date().toISOString(),
            change: `₱${Number(record.price ?? 0).toFixed(2)}`,
          })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setActivityItems(nextItems.slice(0, 5));

        const recentStoreRows = [...storesData]
          .map((store) => ({
            id: store.id,
            name: store.name,
            location: store.location ?? '—',
            officerName: store.user?.name ?? 'Unassigned',
            createdAt: store.createdAt ?? '',
          }))
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
          .slice(0, 5);

        setRecentStores(recentStoreRows);
      } catch (error) {
        console.error("Failed to load activity feed and recent stores", error);
      } finally {
        setRecentLoading(false);
      }
    }

    void loadActivityAndRecentStores();
  }, []);

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-12 md:px-container-margin-desktop">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-sans text-h1-desktop text-on-surface">
                Admin monitoring dashboard
              </h2>
              <p className="mt-1 font-sans text-on-surface-variant">
                Here is the market overview for today, {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}.
              </p>
            </div>
          </div>

          <section className="flex flex-wrap gap-6">
            {statsLoading
              ? stats.map((stat) => <SkeletonStatCard key={stat.label} />)
              : stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex min-w-52.5 flex-1 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className={`rounded-xl p-2 ${stat.iconBg}`}>
                        <stat.icon className={stat.iconColor} size={24} />
                      </div>
                      {stat.meta ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            stat.metaStyle ?? "bg-primary/5 text-primary"
                          }`}
                        >
                          {stat.meta}
                        </span>
                      ) : null}
                    </div>
                    <p className="mb-1 font-sans text-label-caps text-on-surface-variant">
                      {stat.label}
                    </p>
                    <h3
                      className={`text-[32px] font-bold leading-none ${
                        stat.valueColor ?? "text-on-surface"
                      }`}
                    >
                      {stat.value}
                    </h3>
                  </div>
                ))}
          </section>

          <section className="space-y-6">
            <h3 className="font-sans text-h2-desktop text-on-surface">Market Insights</h3>
            <PriceTrendLineChart
              points={analytics?.priceTrend ?? []}
              isLoading={analyticsLoading}
              error={analyticsError}
            />
            <div className="grid gap-6 xl:grid-cols-2">
              <CommodityComparisonChart
                points={analytics?.commodityComparison ?? []}
                isLoading={analyticsLoading}
                error={analyticsError}
              />
              <SrpVsActualChart
                points={analytics?.srpVsActual ?? []}
                isLoading={analyticsLoading}
                error={analyticsError}
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
            <div className="flex min-h-105 w-full flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
              <div className="mb-6">
                <h4 className="font-sans text-h3-desktop text-on-surface">
                  Recent Activity
                </h4>
              </div>
              <div className="flex-1 space-y-6">
                {recentLoading ? (
                  Array.from({ length: 5 }, (_, index) => index).map((row) => (
                    <div key={row} className="flex items-start gap-4">
                      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))
                ) : (
                  activityItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div
                        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.iconStyle}`}
                      >
                        <item.icon size={18} />
                      </div>
                      <div>
                        <p className="text-body-sm text-on-surface">
                          <span className="font-semibold">{item.title}</span> {item.description}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-outline">
                            {item.time}
                          </span>
                          {item.change ? (
                            <span className="text-xs font-bold text-primary">{item.change}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h4 className="font-sans text-h3-desktop text-on-surface">
                  Recently Added Stores
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/30">
                      <th className="pb-4 text-[10px] font-semibold uppercase tracking-wide text-outline">Store Name</th>
                      <th className="pb-4 text-[10px] font-semibold uppercase tracking-wide text-outline">Officer</th>
                      <th className="pb-4 text-[10px] font-semibold uppercase tracking-wide text-outline">Added On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {recentLoading
                      ? Array.from({ length: 5 }, (_, index) => index).map((row) => (
                          <tr key={row}>
                            <td className="py-4">
                              <div className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                              </div>
                            </td>
                            <td className="py-4">
                              <Skeleton className="h-4 w-24" />
                            </td>
                            <td className="py-4">
                              <Skeleton className="h-4 w-20" />
                            </td>
                          </tr>
                        ))
                      : recentStores.map((row) => (
                          <tr key={row.id}>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-on-surface">{row.name}</span>
                                <span className="text-sm text-on-surface-variant">{row.location}</span>
                              </div>
                            </td>
                            <td className="py-4 text-sm text-on-surface">{row.officerName}</td>
                            <td className="py-4 text-sm text-on-surface-variant">
                              {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </section>
    </PageShell>
  );
}
