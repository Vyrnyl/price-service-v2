"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { MdLocalDining, MdLocalGroceryStore, MdSearch } from "react-icons/md";
import Badge, { type BadgeVariant } from "@/shared/components/Badge";
import DataProvenanceStrip from "@/shared/components/DataProvenanceStrip";
import Input from "@/shared/components/Input";
import PageShell from "@/shared/components/PageShell";
import Pagination from "@/shared/components/Pagination";
import Select from "@/shared/components/Select";
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

function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "Above SRP":
      return "error";
    case "Below SRP":
      return "success";
    case "Compliant":
      return "primary";
    default:
      return "neutral";
  }
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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [municipalityFilter, setMunicipalityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 5;

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
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allRows.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [row.name, row.category, row.storeName, row.municipality, row.commodityStatus, row.status].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      const matchesCategory = categoryFilter === "All" || row.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesMunicipality = municipalityFilter === "All" || row.municipality === municipalityFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesMunicipality;
    });
  }, [allRows, categoryFilter, municipalityFilter, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return tableRows.slice(startIndex, startIndex + pageSize);
  }, [safeCurrentPage, tableRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, municipalityFilter]);

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

        <div className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow">
          <Input
            icon={<MdSearch size={20} />}
            placeholder="Search commodity, store, or municipality..."
            aria-label="Search commodities"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? "All categories" : category}
                </option>
              ))}
            </Select>

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

            <Select
              value={municipalityFilter}
              onChange={(event) => setMunicipalityFilter(event.target.value)}
              aria-label="Filter by municipality"
            >
              {municipalities.map((municipality) => (
                <option key={municipality} value={municipality}>
                  {municipality === "All" ? "All municipalities" : municipality}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <div className="space-y-4">
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
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">Compliance</th>
                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">Last Updated</th>
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
                          className="border-b border-outline-variant transition-colors last:border-b-0 hover:bg-surface-container"
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${row.iconBg}`}>
                                <Icon className="text-base" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-on-surface">{row.name}</div>
                                <div className="text-[11px] text-outline">
                                  {row.storeName !== "N/A" ? `${row.storeName} · ${row.municipality}` : "No recent store data"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-md bg-surface-variant px-2.5 py-1 text-xs text-on-surface-variant">{row.category}</span>
                          </td>
                          <td className="px-3 py-3 text-sm font-medium text-on-surface">{row.priceRangeLabel}</td>
                          <td className="px-3 py-3 text-sm text-outline">{row.srp}</td>
                          <td className="px-3 py-3">
                            <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
                          </td>
                          <td className="px-3 py-3 text-xs text-on-surface-variant">{row.lastUpdated}</td>
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
                  <div
                    key={row.id}
                    className="rounded-xl border border-outline-variant bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${row.iconBg}`}>
                          <Icon className="text-base" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{row.name}</p>
                          <p className="mt-0.5 text-[11px] text-outline">{row.category}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
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
                      <span>{row.storeName !== "N/A" ? `${row.storeName} · ${row.municipality}` : "No recent store data"}</span>
                      <span>{row.lastUpdated}</span>
                    </div>
                  </div>
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
    </PageShell>
  );
}
