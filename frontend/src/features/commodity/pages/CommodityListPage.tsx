"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { MdChevronRight, MdLocalDining, MdLocalGroceryStore } from "react-icons/md";
import Badge from "@/shared/components/Badge";
import DataProvenanceStrip from "@/shared/components/DataProvenanceStrip";
import PageShell from "@/shared/components/PageShell";
import Pagination from "@/shared/components/Pagination";
import Select from "@/shared/components/Select";
import SearchableSelect from "@/shared/components/SearchableSelect";
import { SrpHistoryModal } from "../components/SrpHistoryModal";
import { useSrpHistory } from "../hooks/use-srp-history";
import { getPublicCommodities, type PublicCommodityItem, type PublicPriceRange } from "../services/commodity.api";

interface CommodityRow {
  id: string;
  name: string;
  category: string;
  commodityStatus: string;
  priceRangeLabel: string;
  srp: string;
  status: string;
  lastUpdated: string;
  storeName: string;
  municipality: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
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

/**
 * Shows the honest spread across reporting stores rather than a single blended
 * figure — a range is the only way "one cheap store, one overpriced store" stays
 * visible instead of averaging out to something that looks fine (D-8).
 */
function formatPriceRange(range: PublicPriceRange | null, fallback: number | null) {
  if (!range) {
    return formatCurrency(fallback);
  }

  if (range.min === range.max) {
    return formatCurrency(range.min);
  }

  return `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`;
}

function formatLastUpdated(value: string | null) {
  if (!value) {
    return "Recently updated";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function mapCommoditiesToRows(commodities: PublicCommodityItem[]): CommodityRow[] {
  return commodities.map((commodity, index) => ({
    id: commodity.id,
    name: commodity.name,
    category: commodity.category,
    commodityStatus: commodity.status || "Unknown",
    priceRangeLabel: formatPriceRange(commodity.priceRange, commodity.currentPrice),
    srp: formatCurrency(commodity.srpPrice),
    status: commodity.complianceStatus || "Unknown",
    lastUpdated: formatLastUpdated(commodity.lastUpdatedAt),
    storeName: commodity.storeName || "N/A",
    municipality: commodity.storeLocation || "N/A",
    icon: index % 2 === 0 ? MdLocalDining : MdLocalGroceryStore,
    iconBg: "bg-primary-container/10 text-primary",
  }));
}

export default function CommodityListPage() {
  const [allRows, setAllRows] = useState<CommodityRow[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [municipalityFilter, setMunicipalityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyRow, setHistoryRow] = useState<CommodityRow | null>(null);
  const pageSize = 5;

  const srpHistory = useSrpHistory(historyRow?.id ?? null);

  const categories = useMemo(() => {
    const values = allRows
      .map((row) => row.category)
      .filter((value): value is string => Boolean(value))
      .sort();

    return ["All", ...Array.from(new Set(values))];
  }, [allRows]);

  const statuses = useMemo(() => {
    const values = allRows
      .map((row) => row.status)
      .filter((value): value is string => Boolean(value))
      .sort();

    return ["All", ...Array.from(new Set(values))];
  }, [allRows]);

  const municipalities = useMemo(() => {
    const values = allRows
      .map((row) => row.municipality)
      .filter((value): value is string => Boolean(value) && value !== "N/A")
      .sort();

    return ["All", ...Array.from(new Set(values))];
  }, [allRows]);

  const tableRows = useMemo(() => {
    return allRows.filter((row) => {
      const matchesCategory = categoryFilter === "All" || row.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesMunicipality = municipalityFilter === "All" || row.municipality === municipalityFilter;

      return matchesCategory && matchesStatus && matchesMunicipality;
    });
  }, [allRows, categoryFilter, municipalityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return tableRows.slice(startIndex, startIndex + pageSize);
  }, [safeCurrentPage, tableRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, municipalityFilter]);

  useEffect(() => {
    async function loadCommodities() {
      try {
        const commodities = await getPublicCommodities();
        setAllRows(mapCommoditiesToRows(commodities));
      } catch {
        setError("Unable to load commodities. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadCommodities();
  }, []);

  return (
    <PageShell className="overflow-x-hidden p-container-margin-mobile md:p-container-margin-desktop">
      <section className="space-y-4 pb-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-on-surface md:text-3xl">
              Commodity Monitoring
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant md:text-base">
              Real-time market price surveillance for Catanduanes Province.
            </p>
          </div>
        </div>

        <DataProvenanceStrip />

        <p className="text-sm text-on-surface-variant">
          Not sure what <Badge variant="error">Above SRP</Badge> means, or spotted a price that looks wrong?{" "}
          <Link href="/report-a-concern" className="font-semibold text-primary hover:underline">
            Learn about SRP & how to report it →
          </Link>
        </p>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full sm:w-64">
              <SearchableSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categories.map((category) => ({
                  value: category,
                  label: category === "All" ? "All categories" : category,
                }))}
                placeholder="All categories"
                searchPlaceholder="Search category"
                emptyLabel="No categories found."
                aria-label="Filter by category"
              />
            </div>

            <div className="w-full sm:w-64">
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by compliance status"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All statuses" : status}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">Select a commodity to see how its SRP has changed over time.</p>

        {error ? (
          <div className="rounded-xl border border-error bg-error/10 p-4 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow">
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">Commodity</th>
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">Category</th>
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">Price Range</th>
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">SRP</th>
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">Last Updated</th>
                    <th className="w-10 px-3 py-3">
                      <span className="sr-only">SRP history</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-on-surface-variant">
                        Loading commodities...
                      </td>
                    </tr>
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-on-surface-variant">
                        No commodities found.
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((row) => {
                      const Icon = row.icon;
                      return (
                        <tr
                          key={row.id}
                          tabIndex={0}
                          aria-label={`View SRP history for ${row.name}`}
                          onClick={() => setHistoryRow(row)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setHistoryRow(row);
                            }
                          }}
                          className="cursor-pointer border-b border-outline-variant transition-colors last:border-b-0 hover:bg-surface-container focus-visible:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${row.iconBg}`}>
                                <Icon className="text-base" />
                              </div>
                              <div className="text-sm font-semibold text-on-surface">{row.name}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-md bg-surface-variant px-2.5 py-1 text-xs text-on-surface-variant">{row.category}</span>
                          </td>
                          <td className="px-3 py-3 text-sm font-medium text-on-surface">{row.priceRangeLabel}</td>
                          <td className="px-3 py-3 text-sm text-outline">{row.srp}</td>
                          <td className="px-3 py-3 text-xs text-on-surface-variant">{row.lastUpdated}</td>
                          <td className="px-3 py-3 text-outline">
                            <MdChevronRight size={20} aria-hidden="true" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-on-surface-variant">Loading commodities...</p>
            ) : tableRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-on-surface-variant">No commodities found.</p>
            ) : (
              pagedRows.map((row) => {
                const Icon = row.icon;
                return (
                  <button
                    type="button"
                    key={row.id}
                    aria-label={`View SRP history for ${row.name}`}
                    onClick={() => setHistoryRow(row)}
                    className="block w-full rounded-xl border border-outline-variant bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${row.iconBg}`}>
                        <Icon className="text-base" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{row.name}</p>
                        <p className="mt-0.5 text-[11px] text-outline">{row.category}</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-on-surface-variant">Price range</p>
                        <p className="font-semibold text-on-surface">{row.priceRangeLabel}</p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant">SRP</p>
                        <p className="font-semibold text-on-surface">{row.srp}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-outline-variant pt-2 text-[11px] text-on-surface-variant">
                      <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
                        SRP history
                        <MdChevronRight size={16} aria-hidden="true" />
                      </span>
                      <span>{row.lastUpdated}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">
            Showing {tableRows.length === 0 ? 0 : `${(safeCurrentPage - 1) * pageSize + 1}-${Math.min(safeCurrentPage * pageSize, tableRows.length)}`} of {tableRows.length} commodities
          </p>
          <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>

      <SrpHistoryModal
        open={historyRow !== null}
        onClose={() => setHistoryRow(null)}
        commodityName={historyRow?.name ?? ""}
        category={historyRow?.category}
        entries={srpHistory.entries}
        isLoading={srpHistory.isLoading}
        error={srpHistory.error}
        onRetry={srpHistory.retry}
      />
    </PageShell>
  );
}
