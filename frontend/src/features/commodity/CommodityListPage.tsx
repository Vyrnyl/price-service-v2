"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  MdKeyboardArrowDown,
  MdLocalDining,
  MdLocalGroceryStore,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
  MdSearch,
} from "react-icons/md";
import { PriceRecordsTable, type PriceRecord } from "@/features/price-record";
import { getPublicCommodities, type PublicCommodityItem } from "./api/commodity.api";

interface CommodityRow {
  id: string;
  name: string;
  category: string;
  commodityStatus: string;
  current: string;
  srp: string;
  status: string;
  statusTone: string;
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

function getStatusTone(status: string) {
  switch (status) {
    case "Above SRP":
      return "bg-error/10 text-error";
    case "Below SRP":
      return "bg-success/10 text-success";
    case "Compliant":
      return "bg-primary/10 text-primary";
    default:
      return "bg-surface-container/10 text-on-surface-variant";
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
    current: formatCurrency(commodity.currentPrice),
    srp: formatCurrency(commodity.srpPrice),
    status: commodity.complianceStatus || "Unknown",
    statusTone: getStatusTone(commodity.complianceStatus || "Unknown"),
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


  const tableRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allRows.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [row.name, row.category, row.storeName, row.municipality, row.commodityStatus, row.status].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      const matchesCategory = categoryFilter === "All" || row.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [allRows, categoryFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return tableRows.slice(startIndex, startIndex + pageSize);
  }, [safeCurrentPage, tableRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

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
    <main className="flex-1 overflow-y-auto overflow-x-hidden p-container-margin-mobile md:p-container-margin-desktop lg:ml-72">
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

        <div className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm md:flex-row md:items-center">
          <div className="relative w-full md:max-w-xs">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              className="w-full rounded-xl border border-outline-variant bg-surface py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Search Commodity..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-outline">Filters:</span>
            <label className="relative flex items-center gap-1 overflow-hidden rounded-full bg-surface-container-high px-3 py-1.5 text-xs text-on-surface transition-colors hover:bg-surface-container-highest">
              <span className="whitespace-nowrap">{categoryFilter === "All" ? "Category: All" : `Category: ${categoryFilter}`}</span>
              <MdKeyboardArrowDown />
              <select
                className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none opacity-0"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by category"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "All" ? "All categories" : category}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-error bg-error/10 p-4 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">Commodity</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">Category</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-outline">SRP</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-sm text-on-surface-variant">
                      Loading commodities...
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-sm text-on-surface-variant">
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
                                {row.storeName !== "N/A" ? `${row.storeName}` : "No recent store data"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-md bg-surface-variant px-2.5 py-1 text-xs text-on-surface-variant">{row.category}</span>
                        </td>
                        <td className="px-3 py-3 text-sm text-outline">{row.srp}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">
            Showing {tableRows.length === 0 ? 0 : `${(safeCurrentPage - 1) * pageSize + 1}-${Math.min(safeCurrentPage * pageSize, tableRows.length)}`} of {tableRows.length} commodities
          </p>
          <div className="flex items-center gap-1">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-outline transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <MdOutlineChevronLeft size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                  safeCurrentPage === page
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-outline transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <MdOutlineChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {selectedCommodity ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-on-surface">Price Records</h2>
                <p className="mt-0.5 text-[11px] text-on-surface-variant sm:text-xs">
                  Recent submissions and compliance status.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCommodityRecords}
                className="inline-flex rounded-full bg-surface px-2.5 py-1.5 text-xs text-on-surface transition hover:bg-surface-container-high sm:px-3 sm:py-2 sm:text-sm"
              >
                Close
              </button>
            </div>

            <div className="mb-2 flex flex-col gap-2 rounded-2xl border border-outline-variant bg-white p-2 sm:flex-row sm:items-center sm:justify-between">
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-outline transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                      disabled={safeRecordPage === 1}
                      onClick={() => setRecordPage((page) => Math.max(1, page - 1))}
                    >
                      <MdOutlineChevronLeft size={20} />
                    </button>
                    {Array.from({ length: totalRecordPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-semibold transition-colors sm:h-8 sm:w-8 sm:text-xs ${
                          safeRecordPage === page
                            ? "border-primary bg-primary text-on-primary"
                            : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                        onClick={() => setRecordPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-outline transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                      disabled={safeRecordPage === totalRecordPages}
                      onClick={() => setRecordPage((page) => Math.min(totalRecordPages, page + 1))}
                    >
                      <MdOutlineChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-4 text-body-sm text-on-surface-variant">
                {selectedCommodity.records.length > 0 ? "No records match the current filters." : "No price records found for this commodity."}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
