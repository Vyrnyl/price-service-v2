"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { MdLocalDining, MdLocalGroceryStore, MdSearch } from "react-icons/md";
import { PriceRecordsTable, type PriceRecord } from "@/features/price-record";
import Badge, { type BadgeVariant } from "@/shared/components/Badge";
import DataProvenanceStrip from "@/shared/components/DataProvenanceStrip";
import Input from "@/shared/components/Input";
import Modal from "@/shared/components/Modal";
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
  records: PriceRecord[];
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

function formatDateTimeParts(value: string | null) {
  if (!value) {
    return { date: "N/A", time: "N/A" };
  }

  const dateObject = new Date(value);
  if (Number.isNaN(dateObject.getTime())) {
    return { date: "N/A", time: "N/A" };
  }

  return {
    date: dateObject.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: dateObject.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case "COMPLIANT":
      return "Compliant";
    case "OVERPRICE":
      return "Above SRP";
    case "UNDERPRICE":
      return "Below SRP";
    default:
      return "Unknown";
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
    records: commodity.priceRecords.map((record) => {
      const { date, time } = formatDateTimeParts(record.dateAndTime);
      return {
        id: record.id,
        storeId: "",
        commodityId: commodity.id,
        date,
        time,
        store: record.storeName || "N/A",
        location: record.storeLocation || "N/A",
        commodity: commodity.name,
        commodityDetails: commodity.category,
        price: formatCurrency(record.price),
        status: record.complianceStatus || getStatusLabel(record.status),
        srp: record.srpPrice != null ? formatCurrency(record.srpPrice) : undefined,
        officerInitials: "PV",
        officerName: "Public View",
      } satisfies PriceRecord;
    }),
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
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityRow | null>(null);
  const [recordSearchTerm, setRecordSearchTerm] = useState("");
  const [recordStatusFilter, setRecordStatusFilter] = useState("All");
  const [recordStoreFilter, setRecordStoreFilter] = useState("All");
  const [recordPage, setRecordPage] = useState(1);
  const pageSize = 5;
  const recordPageSize = 5;

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
    setRecordPage(1);
  }, [recordSearchTerm, recordStatusFilter, recordStoreFilter, selectedCommodity?.id]);

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

  const handleOpenCommodityRecords = (row: CommodityRow) => {
    setSelectedCommodity(row);
    setRecordSearchTerm("");
    setRecordStatusFilter("All");
    setRecordStoreFilter("All");
    setRecordPage(1);
  };

  const handleCloseCommodityRecords = () => {
    setSelectedCommodity(null);
    setRecordSearchTerm("");
    setRecordStatusFilter("All");
    setRecordStoreFilter("All");
    setRecordPage(1);
  };

  const filteredRecordRows = useMemo(() => {
    if (!selectedCommodity) {
      return [];
    }

    const normalizedSearch = recordSearchTerm.trim().toLowerCase();

    return selectedCommodity.records.filter((record) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [record.store, record.location, record.commodity, record.status, record.price].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      const matchesStatus = recordStatusFilter === "All" || record.status === recordStatusFilter;
      const matchesStore = recordStoreFilter === "All" || record.store === recordStoreFilter;

      return matchesSearch && matchesStatus && matchesStore;
    });
  }, [recordSearchTerm, recordStatusFilter, recordStoreFilter, selectedCommodity]);

  const recordStoreOptions = useMemo(() => {
    if (!selectedCommodity) {
      return ["All"];
    }

    const stores = Array.from(new Set(selectedCommodity.records.map((record) => record.store))).filter(Boolean);
    return ["All", ...stores.sort()];
  }, [selectedCommodity]);

  const totalRecordPages = Math.max(1, Math.ceil(filteredRecordRows.length / recordPageSize));
  const safeRecordPage = Math.min(recordPage, totalRecordPages);
  const pagedRecordRows = useMemo(() => {
    const startIndex = (safeRecordPage - 1) * recordPageSize;
    return filteredRecordRows.slice(startIndex, startIndex + recordPageSize);
  }, [filteredRecordRows, safeRecordPage]);

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
                          className="cursor-pointer border-b border-outline-variant transition-colors last:border-b-0 hover:bg-surface-container"
                          onClick={() => handleOpenCommodityRecords(row)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleOpenCommodityRecords(row);
                            }
                          }}
                          tabIndex={0}
                          role="button"
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
                    className="cursor-pointer rounded-xl border border-outline-variant bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
                    onClick={() => handleOpenCommodityRecords(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenCommodityRecords(row);
                      }
                    }}
                    tabIndex={0}
                    role="button"
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

      {selectedCommodity ? (
        <Modal
          open
          onClose={handleCloseCommodityRecords}
          title="Price Records"
          description="Recent submissions and compliance status."
          maxWidth="max-w-4xl"
        >
            <div className="mb-2 flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 sm:flex-row sm:items-center sm:justify-between">
              <input
                className="w-full rounded-xl border border-outline-variant bg-surface py-1.5 px-2.5 text-[11px] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary sm:max-w-xs sm:text-xs"
                placeholder="Filter records by store, status, or price"
                type="text"
                value={recordSearchTerm}
                onChange={(event) => setRecordSearchTerm(event.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-[11px] text-on-surface-variant sm:text-xs">
                  <span>Status</span>
                  <select
                    className="rounded-full border border-outline-variant bg-surface px-2 py-1 text-[11px] outline-none focus:border-primary sm:text-xs"
                    value={recordStatusFilter}
                    onChange={(event) => setRecordStatusFilter(event.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Compliant">Compliant</option>
                    <option value="Above SRP">Above SRP</option>
                    <option value="Below SRP">Below SRP</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-[11px] text-on-surface-variant sm:text-xs">
                  <span>Store</span>
                  <select
                    className="rounded-full border border-outline-variant bg-surface px-2 py-1 text-[11px] outline-none focus:border-primary sm:text-xs"
                    value={recordStoreFilter}
                    onChange={(event) => setRecordStoreFilter(event.target.value)}
                  >
                    {recordStoreOptions.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {filteredRecordRows.length > 0 ? (
              <>
                <PriceRecordsTable
                  records={pagedRecordRows}
                  hideActions
                  hideOfficerColumn
                  hideCommodityColumn
                  compact
                  headerHighlight={selectedCommodity.name}
                />
                <div className="mt-2 flex flex-col gap-2 border-t border-outline-variant pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-on-surface-variant sm:text-xs">
                    Showing {filteredRecordRows.length === 0 ? 0 : `${(safeRecordPage - 1) * recordPageSize + 1}-${Math.min(safeRecordPage * recordPageSize, filteredRecordRows.length)}`} of {filteredRecordRows.length} records
                  </p>
                  <Pagination
                    currentPage={safeRecordPage}
                    totalPages={totalRecordPages}
                    onPageChange={setRecordPage}
                    size="sm"
                  />
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-4 text-body-sm text-on-surface-variant">
                {selectedCommodity.records.length > 0 ? "No records match the current filters." : "No price records found for this commodity."}
              </div>
            )}
        </Modal>
      ) : null}
    </PageShell>
  );
}
