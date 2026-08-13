"use client";

import { useEffect, useState } from "react";
import { MdInventory2, MdNotificationsActive, MdSearch, MdStore, MdTrendingUp } from "react-icons/md";
import { apiFetch } from "@/lib/api";

const stats = [
  {
    label: "Total Commodities",
    valueKey: "commodities",
    icon: MdInventory2,
    tone: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Added Stores",
    valueKey: "stores",
    icon: MdStore,
    tone: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    label: "Added Price Records",
    valueKey: "priceRecords",
    icon: MdTrendingUp,
    tone: "text-[#00897B]",
    bg: "bg-[#E8F5E9]",
  },
];

const rows = [
  {
    commodity: "Rice (Well-milled)",
    store: "ABC Supermarket",
    region: "Virac",
    price: "₱58.00",
    srp: "₱55.00",
    status: "Above SRP",
    statusClass: "bg-error text-on-error",
  },
  {
    commodity: "Cooking Oil",
    store: "Virac Public Market",
    region: "Virac",
    price: "₱85.00",
    srp: "₱85.00",
    status: "Compliant",
    statusClass: "bg-[#00897B] text-on-primary",
  },
  {
    commodity: "Canned Sardines",
    store: "SaveMore Virac",
    region: "Bato",
    price: "₱19.50",
    srp: "₱21.00",
    status: "Below SRP",
    statusClass: "bg-tertiary-container text-on-tertiary",
  },
];

export default function MonitoringOfficerDashboardPage() {
  const [totalCommodities, setTotalCommodities] = useState(0);
  const [totalStores, setTotalStores] = useState(0);
  const [totalPriceRecords, setTotalPriceRecords] = useState(0);
  const [latestStores, setLatestStores] = useState<Array<{ id: string; name: string; location: string; createdAt: string }>>([]);
  const [latestPriceRecords, setLatestPriceRecords] = useState<Array<{ id: string; commodity: { name: string }; store: { name: string } | null; price: string; createdAt: string }>>([]);
  const [latestReports, setLatestReports] = useState<Array<{ id: string; type: string; period: string; createdAt: string }>>([]);

  useEffect(() => {
    async function loadDashboardCounts() {
      try {
        const [commoditiesResponse, storesResponse, priceRecordsResponse, reportsResponse] = await Promise.all([
          apiFetch<{ status: string; data: unknown[] }>("/api/commodities"),
          apiFetch<{ status: string; data: Array<{ id: string; name: string; location: string; createdAt: string }> }>("/api/stores"),
          apiFetch<{ status: string; data: Array<{ id: string; commodity: { name: string }; store: { name: string } | null; price: string; createdAt: string }> }>("/api/price-records"),
          apiFetch<{ status: string; data: Array<{ id: string; type: string; period: string; createdAt: string }> }>("/api/reports"),
        ]);

        setTotalCommodities(commoditiesResponse.data.length);
        setTotalStores(storesResponse.data.length);
        setTotalPriceRecords(priceRecordsResponse.data.length);

        const sortedStores = [...storesResponse.data].sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLatestStores(sortedStores.slice(0, 3));

        const sortedPriceRecords = [...priceRecordsResponse.data].sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLatestPriceRecords(sortedPriceRecords.slice(0, 3));

        const sortedReports = [...reportsResponse.data].sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLatestReports(sortedReports.slice(0, 3));
      } catch (error) {
        console.error("Failed to load dashboard counts", error);
      }
    }

    void loadDashboardCounts();
  }, []);

  return (
    <main className="min-h-screen lg:ml-72">
      <section className="px-container-margin-mobile py-12 md:px-container-margin-desktop">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-h1-desktop text-h1-desktop text-on-surface">
                Monitoring Officer Overview
              </h2>
              <p className="mt-1 font-body-lg text-on-surface-variant">
                Track the latest operational activity in your monitoring area.
              </p>
            </div>
          </div>

          <section className="flex flex-wrap gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const value =
                stat.valueKey === "commodities"
                  ? totalCommodities
                  : stat.valueKey === "stores"
                  ? totalStores
                  : totalPriceRecords;

              return (
                <div
                  key={stat.label}
                  className="flex min-w-48 flex-1 flex-col rounded-2xl border border-outline-variant bg-white p-4 data-card-shadow"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className={`rounded-xl p-2 ${stat.bg}`}>
                      <Icon className={stat.tone} size={20} />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-outline">
                      Total
                    </span>
                  </div>
                  <p className="mb-1 font-label-caps text-label-caps text-on-surface-variant">
                    {stat.label}
                  </p>
                  <h3 className="text-[28px] font-bold leading-none text-on-surface">
                    {value}
                  </h3>
                </div>
              );
            })}
          </section>

          <section className="rounded-3xl border border-outline-variant bg-white p-6 data-card-shadow md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-h3-desktop text-h3-desktop text-on-surface">
                  Recent Activity
                </h3>
                <p className="text-body-sm text-on-surface-variant">Latest stores, price records, and reports added to the system.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-4">
                <p className="mb-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.24em]">
                  Added Stores
                </p>
                <div className="space-y-3">
                  {latestStores.length > 0 ? (
                    latestStores.map((store) => (
                      <div key={store.id} className="rounded-2xl bg-white p-3 shadow-sm">
                        <p className="font-semibold text-on-surface">{store.name}</p>
                        <p className="text-body-sm text-on-surface-variant">{store.location}</p>
                        <p className="mt-2 text-[11px] text-on-surface-variant">{new Date(store.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-body-sm text-on-surface-variant">No recently added stores.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-4">
                <p className="mb-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.24em]">
                  Added Price Records
                </p>
                <div className="space-y-3">
                  {latestPriceRecords.length > 0 ? (
                    latestPriceRecords.map((record) => (
                      <div key={record.id} className="rounded-2xl bg-white p-3 shadow-sm">
                        <p className="font-semibold text-on-surface">{record.commodity.name}</p>
                        <p className="text-body-sm text-on-surface-variant">{record.store?.name ?? "Unknown store"}</p>
                        <p className="mt-2 text-[11px] text-on-surface-variant">{new Date(record.createdAt).toLocaleDateString()} • {record.price}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-body-sm text-on-surface-variant">No recent price records.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-4">
                <p className="mb-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.24em]">
                  Reports Activity
                </p>
                <div className="space-y-3">
                  {latestReports.length > 0 ? (
                    latestReports.map((report) => (
                      <div key={report.id} className="rounded-2xl bg-white p-3 shadow-sm">
                        <p className="font-semibold text-on-surface">{report.type.replace(/_/g, " ")}</p>
                        <p className="text-body-sm text-on-surface-variant">{report.period}</p>
                        <p className="mt-2 text-[11px] text-on-surface-variant">{new Date(report.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-body-sm text-on-surface-variant">No recent report activity.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
