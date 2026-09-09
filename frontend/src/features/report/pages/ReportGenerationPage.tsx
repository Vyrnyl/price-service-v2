"use client";

import { useEffect, useMemo, useState } from "react";
import { MdDownload } from "react-icons/md";
import { fetchAllPages } from "@/shared/services/api";
import { useToast } from "@/shared/components/Toast";
import PageShell from "@/shared/components/PageShell";
import Chip from "@/shared/components/Chip";
import Skeleton from "@/shared/components/Skeleton";
import SearchableSelect from "@/shared/components/SearchableSelect";
import { reportTypes, exportFormats } from "../mocks/report.mock";
import ExportFormatButton from "../components/ExportFormatButton";
import RecentReportCard from "../components/RecentReportCard";
import ReportTypeCard from "../components/ReportTypeCard";
import Pagination from "@/shared/components/Pagination";
import { createReport, deleteAllReports, getReports } from "../services/report.api";
import type { BackendReport, CreateReportPayload, RecentReport } from "../types/report.types";

const REPORTS_PAGE_SIZE = 10;

type StoreOption = {
  id: string;
  name: string;
  location: string;
};

type CategoryOption = {
  value: string;
  label: string;
};

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: "ALL", label: "All Categories" },
];

const MAX_CUSTOM_RANGE_DAYS = 30;

type RangeKey = "Week" | "Month" | "3M" | "6M" | "1Y" | "Custom";

type RangeDescriptor = {
  key: RangeKey;
  label: string;
  /** Rolling window length in days. `null` for "Custom", which uses explicit start/end dates instead. */
  days: number | null;
};

const RANGE_DESCRIPTORS: Record<RangeKey, RangeDescriptor> = {
  Week: { key: "Week", label: "Week", days: 7 },
  Month: { key: "Month", label: "Month", days: 30 },
  "3M": { key: "3M", label: "3M", days: 90 },
  "6M": { key: "6M", label: "6M", days: 182 },
  "1Y": { key: "1Y", label: "1Y", days: 365 },
  Custom: { key: "Custom", label: "Custom", days: null },
};

const rangeOptions = Object.values(RANGE_DESCRIPTORS);

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDaysToDate(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Earlier of two ISO dates — the end picker is bounded by both the cap and today. */
function minIsoDate(a: string, b: string) {
  return a < b ? a : b;
}

function getDateRangeError(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return "Start date cannot be after the end date.";
  }

  const diffInDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays > MAX_CUSTOM_RANGE_DAYS) {
    return `Selected range is ${diffInDays} days — a custom range cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days. Pick a shorter range, or use a preset above for a longer period.`;
  }

  return null;
}

function formatPeriod(period: string) {
  const [start, end] = period.split(" to ").map((value) => new Date(value));
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return period;
  }

  const startLabel = start.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  return `${startLabel} – ${endLabel}`;
}

function mapBackendReportToRecent(report: BackendReport): RecentReport {
  const formattedDate = new Date(report.createdAt).toLocaleDateString("en-PH", {
    dateStyle: "medium",
  });

  const typeTitle = reportTypes.find((type) => type.backendType === report.type)?.title ?? report.type.replace(/_/g, " ");
  const fileFormat = report.filename.toLowerCase().endsWith(".pdf") ? "PDF" : "Excel";

  return {
    id: report.id,
    name: report.filterLabel ? `${typeTitle} · ${report.filterLabel}` : typeTitle,
    meta: `${formatPeriod(report.period)} · Generated ${formattedDate} · ${fileFormat}`,
    status: "Ready",
    statusClass: "bg-secondary-fixed text-on-secondary-fixed",
    statusIcon: MdDownload,
    buttonLabel: "Download",
    buttonIcon: MdDownload,
    buttonClass: "border border-primary text-primary hover:bg-primary-container hover:text-on-primary-container",
    downloadUrl: `/api/reports/${report.id}/download`,
  };
}

export default function ReportGenerationPage() {
  const visibleReportTypes = reportTypes.filter((type) => type.id !== "daily-compliance");
  const defaultTypeId = visibleReportTypes[0]?.id ?? reportTypes[0].id;
  const defaultFormatLabel = exportFormats.find((format) => format.label === "Adobe PDF")?.label ?? exportFormats[0].label;

  const [selectedReportTypeId, setSelectedReportTypeId] = useState(defaultTypeId);
  const [selectedExportFormat, setSelectedExportFormat] = useState(defaultFormatLabel);
  const [activeRange, setActiveRange] = useState<RangeKey>("Month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [commodityGroup, setCommodityGroup] = useState(DEFAULT_CATEGORIES[0].value);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotal, setReportsTotal] = useState(0);
  const today = useMemo(() => toIsoDate(new Date()), []);
  const { showToast } = useToast();

  const selectedReportType = reportTypes.find((type) => type.id === selectedReportTypeId) ?? reportTypes[0];
  const isStoreMonitoring = selectedReportType.id === "store-monitoring";
  const isDailyCompliance = selectedReportType.id === "daily-compliance";
  const isCustomRange = activeRange === "Custom";

  /**
   * Preset pills resolve to a rolling window ending today and deliberately bypass
   * the 30-day cap — that cap exists to stop an unbounded hand-typed range, and a
   * 3M/6M/1Y preset is an explicit, bounded choice. Only Custom stays capped.
   */
  const resolvedPeriod = useMemo(() => {
    if (isCustomRange) {
      return startDate && endDate ? { startDate, endDate } : null;
    }

    const days = RANGE_DESCRIPTORS[activeRange].days ?? 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    return { startDate: toIsoDate(start), endDate: toIsoDate(new Date()) };
  }, [activeRange, isCustomRange, startDate, endDate]);

  const rangeError = useMemo(
    () => (isCustomRange ? getDateRangeError(startDate, endDate) : null),
    [isCustomRange, startDate, endDate],
  );
  const isGenerateDisabled =
    (!isDailyCompliance && !resolvedPeriod) ||
    Boolean(rangeError) ||
    (isStoreMonitoring && selectedStoreIds.length === 0);

  const period = useMemo(() => {
    if (!resolvedPeriod) {
      return "";
    }

    return `${resolvedPeriod.startDate} to ${resolvedPeriod.endDate}`;
  }, [resolvedPeriod]);

  const loadReports = async (page: number) => {
    try {
      const response = await getReports(page, REPORTS_PAGE_SIZE);
      setRecentReports(response.data.map(mapBackendReportToRecent));
      setReportsTotal(response.total);
    } catch (err) {
      console.error("Unable to load reports", err);
    }
  };

  useEffect(() => {
    async function run() {
      await loadReports(reportsPage);
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsPage]);

  useEffect(() => {
    const loadStores = async () => {
      try {
        setStoresLoading(true);
        const data = await fetchAllPages<StoreOption>("/api/stores");
        setStores(data);
      } catch (err) {
        console.error("Unable to load stores", err);
      } finally {
        setStoresLoading(false);
      }
    };

    void loadStores();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchAllPages<{ category: { name: string } | null }>("/api/commodities");
        const unique = Array.from(
          new Set(data.map((item) => item.category?.name).filter((name): name is string => Boolean(name))),
        ).sort();
        setCategories([
          DEFAULT_CATEGORIES[0],
          ...unique.map((category) => ({ value: category, label: category })),
        ]);
      } catch (err) {
        console.error("Unable to load commodity categories", err);
      }
    };

    void loadCategories();
  }, []);

  const handleReportTypeSelect = (typeId: string) => {
    setSelectedReportTypeId(typeId);

    const nextType = reportTypes.find((type) => type.id === typeId) ?? reportTypes[0];
    if (nextType.id === "daily-compliance") {
      setActiveRange("Custom");
      setStartDate(today);
      setEndDate(today);
      setSelectedStoreIds([]);
      return;
    }

    setActiveRange("Month");
    setStartDate("");
    setEndDate("");
    setSelectedStoreIds([]);
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStoreIds((current) =>
      current.includes(storeId)
        ? current.filter((id) => id !== storeId)
        : [...current, storeId],
    );
  };

  /**
   * Both handlers deliberately keep whatever the user picked rather than
   * silently clamping the other end of the range to fit the cap. Rewriting a
   * date the user just chose, with no message, reads as the picker being
   * broken — surfacing `rangeError` and blocking Generate explains it instead.
   */
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
  };

  const handleGenerateReport = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!selectedReportType || !period) {
      setError("Select a report type and enter a valid date range.");
      return;
    }

    const format = selectedExportFormat === "Adobe PDF" ? "PDF" : "EXCEL";

    const payload: CreateReportPayload = {
      type: selectedReportType.backendType,
      period,
      format,
      commodityGroup: commodityGroup === "ALL" ? undefined : commodityGroup,
      ...(isStoreMonitoring && selectedStoreIds.length > 0 ? { storeIds: selectedStoreIds } : {}),
    };

    try {
      setLoading(true);
      await createReport(payload);
      setSuccessMessage("Report generated successfully.");
      showToast("Report generated successfully.", "success");
      setReportsPage(1);
      await loadReports(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const displayReports = recentReports.length > 0 ? recentReports : [];

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-12 md:px-container-margin-desktop">
        <div className="mx-auto max-w-7xl">
          <header className="mb-10">
            <h2 className="mb-2 font-sans text-h1-desktop text-on-surface">Report Generation</h2>
            <p className="font-sans text-body-lg text-on-surface-variant">
              Configure and generate official market monitoring documentation.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <section className="flex flex-col gap-5 xl:col-span-8">
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-label-caps font-semibold uppercase tracking-[0.24em] text-primary">
                      Step 1
                    </span>
                    <h3 className="mt-4 font-sans text-h3-desktop text-on-surface">Select Report Type</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {visibleReportTypes.map((type) => (
                    <ReportTypeCard
                      key={type.id}
                      type={type}
                      isSelected={selectedReportTypeId === type.id}
                      onSelect={() => handleReportTypeSelect(type.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-label-caps font-semibold uppercase tracking-[0.24em] text-primary">
                      Step 2
                    </span>
                    <h3 className="mt-4 font-sans text-h3-desktop text-on-surface">Configure Parameters</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {!isDailyCompliance ? (
                    <div className="flex flex-col gap-2 min-w-0 md:col-span-2">
                      <label className="font-sans text-label-caps text-on-surface-variant">Date Range</label>
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

                      {isCustomRange ? (
                        <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center">
                          <input
                            className={`flex-1 min-w-0 rounded-xl border bg-surface-container-lowest p-3 font-sans text-body-sm ${
                              rangeError ? "border-error" : "border-outline-variant"
                            }`}
                            type="date"
                            value={startDate}
                            max={endDate || today}
                            aria-label="Custom range start date"
                            aria-invalid={Boolean(rangeError)}
                            onChange={(event) => handleStartDateChange(event.target.value)}
                          />
                          <span className="flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-body-sm font-semibold text-on-surface-variant">
                            to
                          </span>
                          <input
                            className={`flex-1 min-w-0 rounded-xl border bg-surface-container-lowest p-3 font-sans text-body-sm ${
                              rangeError ? "border-error" : "border-outline-variant"
                            }`}
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            max={startDate ? minIsoDate(addDaysToDate(startDate, MAX_CUSTOM_RANGE_DAYS), today) : today}
                            aria-label="Custom range end date"
                            aria-invalid={Boolean(rangeError)}
                            onChange={(event) => handleEndDateChange(event.target.value)}
                          />
                        </div>
                      ) : null}

                      {rangeError ? (
                        <p className="text-sm text-error" role="alert">{rangeError}</p>
                      ) : (
                        <p className="text-sm text-on-surface-variant">
                          {isCustomRange
                            ? `Custom range is limited to ${MAX_CUSTOM_RANGE_DAYS} days.`
                            : `Covers ${period.replace(" to ", " – ")}.`}
                        </p>
                      )}
                    </div>
                  ) : null}

                  {isStoreMonitoring ? (
                    <div className="flex flex-col gap-2 min-w-0 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="font-sans text-label-caps text-on-surface-variant">
                          Store{selectedStoreIds.length > 0 ? ` (${selectedStoreIds.length} selected)` : ""}
                        </label>
                        {selectedStoreIds.length > 0 ? (
                          <button
                            type="button"
                            className="text-body-xs font-semibold text-primary hover:opacity-80"
                            onClick={() => setSelectedStoreIds([])}
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                      {storesLoading ? (
                        <div className="flex flex-wrap gap-2">
                          {[0, 1, 2].map((index) => (
                            <Skeleton key={index} className="h-8 w-32 rounded-full" />
                          ))}
                        </div>
                      ) : stores.length === 0 ? (
                        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 font-sans text-body-sm text-on-surface-variant">
                          No stores available.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
                          {stores.map((store) => (
                            <Chip
                              key={store.id}
                              active={selectedStoreIds.includes(store.id)}
                              onClick={() => toggleStoreSelection(store.id)}
                            >
                              {store.name} • {store.location}
                            </Chip>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-on-surface-variant">
                        Select one or more stores to compare.
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 min-w-0">
                    <label className="font-sans text-label-caps text-on-surface-variant">Category list</label>
                    <SearchableSelect
                      value={commodityGroup}
                      onChange={setCommodityGroup}
                      options={categories.map((category) => ({ value: category.value, label: category.label }))}
                      placeholder="All Categories"
                      searchPlaceholder="Search category"
                      emptyLabel="No categories found."
                      aria-label="Filter by category"
                    />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {exportFormats.map((format) => (
                    <ExportFormatButton
                      key={format.label}
                      format={format}
                      isSelected={format.label === selectedExportFormat}
                      onSelect={() => setSelectedExportFormat(format.label)}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={loading || isGenerateDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-4 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MdDownload size={18} />
                {loading ? "Generating report…" : "GENERATE OFFICIAL REPORT"}
              </button>

              {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
              {successMessage ? <p className="mt-4 text-sm text-success">{successMessage}</p> : null}
            </section>

            <section className="flex flex-col gap-5 xl:col-span-4">
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-sans text-label-caps text-on-surface-variant">Recent Reports</p>
                    <h3 className="font-sans text-h3-desktop text-on-surface">Available exports</h3>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-sm font-semibold text-primary transition hover:border-primary hover:bg-surface-container-high"
                    onClick={async () => {
                      try {
                        await deleteAllReports();
                        setRecentReports([]);
                        setReportsTotal(0);
                        setReportsPage(1);
                        setActiveRange("Month");
                        setStartDate("");
                        setEndDate("");
                        setSelectedReportTypeId(defaultTypeId);
                        setSelectedExportFormat(defaultFormatLabel);
                        setCommodityGroup(DEFAULT_CATEGORIES[0].value);
                        setSelectedStoreIds([]);
                        setError(null);
                        setSuccessMessage("All recent reports have been cleared.");
                        showToast("All recent reports have been cleared.", "success");
                      } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : "Unable to clear recent reports.");
                      }
                    }}
                  >
                    Reset
                  </button>
                </div>

                <div className="max-h-130 space-y-4 overflow-y-auto pr-1 scrollbar-none">
                  {displayReports.map((report) => (
                    <RecentReportCard
                      key={report.id}
                      report={report}
                    />
                  ))}
                </div>

                {reportsTotal > REPORTS_PAGE_SIZE ? (
                  <div className="mt-4 flex flex-col items-center gap-2 border-t border-outline-variant pt-4">
                    <p className="text-body-xs text-on-surface-variant">
                      Showing {(reportsPage - 1) * REPORTS_PAGE_SIZE + 1}-{Math.min(reportsPage * REPORTS_PAGE_SIZE, reportsTotal)} of {reportsTotal}
                    </p>
                    <Pagination
                      currentPage={reportsPage}
                      totalPages={Math.max(1, Math.ceil(reportsTotal / REPORTS_PAGE_SIZE))}
                      onPageChange={setReportsPage}
                      size="sm"
                    />
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
