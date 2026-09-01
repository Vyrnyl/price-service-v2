"use client";

import { useEffect, useMemo, useState } from "react";
import { MdDownload } from "react-icons/md";
import { apiFetch } from "@/shared/services/api";
import { useToast } from "@/shared/components/Toast";
import PageShell from "@/shared/components/PageShell";
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

const MAX_REPORT_RANGE_DAYS = 30;

function addDaysToDate(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
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
  if (diffInDays > MAX_REPORT_RANGE_DAYS) {
    return `Date range cannot exceed ${MAX_REPORT_RANGE_DAYS} days.`;
  }

  return null;
}

function mapBackendReportToRecent(report: BackendReport): RecentReport {
  const formattedDate = new Date(report.createdAt).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const typeTitle = reportTypes.find((type) => type.backendType === report.type)?.title ?? report.type.replace(/_/g, " ");

  return {
    id: report.id,
    name: `${typeTitle} · ${report.period}`,
    meta: formattedDate,
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
  const defaultFormatLabel = exportFormats.find((format) => format.label === "Excel Spreadsheet")?.label ?? exportFormats[0].label;

  const [selectedReportTypeId, setSelectedReportTypeId] = useState(defaultTypeId);
  const [selectedExportFormat, setSelectedExportFormat] = useState(defaultFormatLabel);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [commodityGroup, setCommodityGroup] = useState(DEFAULT_CATEGORIES[0].value);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotal, setReportsTotal] = useState(0);
  const { showToast } = useToast();

  const selectedReportType = reportTypes.find((type) => type.id === selectedReportTypeId) ?? reportTypes[0];
  const isStoreMonitoring = selectedReportType.id === "store-monitoring";
  const isDailyCompliance = selectedReportType.id === "daily-compliance";

  const rangeError = useMemo(() => getDateRangeError(startDate, endDate), [startDate, endDate]);
  const isGenerateDisabled = (!isDailyCompliance && (!startDate || !endDate)) || Boolean(rangeError) || (isStoreMonitoring && !selectedStoreId);

  const period = useMemo(() => {
    if (!startDate || !endDate) {
      return "";
    }

    return `${startDate} to ${endDate}`;
  }, [startDate, endDate]);

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
        const response = await apiFetch<{ status: string; data: StoreOption[] }>("/api/stores?pageSize=100");
        setStores(response.data);
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
        const response = await apiFetch<{ status: string; data: Array<{ category: string }> }>(
          "/api/commodities?pageSize=100",
        );
        const unique = Array.from(new Set(response.data.map((item) => item.category))).sort();
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
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
      setSelectedStoreId("");
      return;
    }

    setStartDate("");
    setEndDate("");
    setSelectedStoreId("");
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);

    if (!value || !endDate) {
      return;
    }

    const error = getDateRangeError(value, endDate);
    if (error && error.includes("exceed")) {
      setEndDate(addDaysToDate(value, MAX_REPORT_RANGE_DAYS));
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);

    if (!startDate || !value) {
      return;
    }

    const error = getDateRangeError(startDate, value);
    if (error && error.includes("exceed")) {
      setEndDate(addDaysToDate(startDate, MAX_REPORT_RANGE_DAYS));
    }
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
      ...(isStoreMonitoring && selectedStoreId ? { storeId: selectedStoreId } : {}),
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
                    <div className="flex flex-col gap-2 min-w-0">
                      <label className="font-sans text-label-caps text-on-surface-variant">Date Range</label>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <input
                          className="flex-1 min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 font-sans text-body-sm"
                          type="date"
                          value={startDate}
                          onChange={(event) => handleStartDateChange(event.target.value)}
                        />
                        <span className="flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-body-sm font-semibold text-on-surface-variant">
                          to
                        </span>
                        <input
                          className="flex-1 min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 font-sans text-body-sm"
                          type="date"
                          value={endDate}
                          onChange={(event) => handleEndDateChange(event.target.value)}
                        />
                      </div>
                      {rangeError ? (
                        <p className="text-sm text-error">{rangeError}</p>
                      ) : (
                        <p className="text-sm text-on-surface-variant">Maximum export range is {MAX_REPORT_RANGE_DAYS} days.</p>
                      )}
                    </div>
                  ) : null}

                  {isStoreMonitoring ? (
                    <div className="flex flex-col gap-2 min-w-0">
                      <label className="font-sans text-label-caps text-on-surface-variant">Store</label>
                      <select
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 font-sans text-body-sm"
                        value={selectedStoreId}
                        onChange={(event) => setSelectedStoreId(event.target.value)}
                        disabled={storesLoading}
                      >
                        <option value="">{storesLoading ? "Loading stores..." : "Select a store"}</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name} • {store.location}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 min-w-0">
                      <label className="font-sans text-label-caps text-on-surface-variant">Category list</label>
                      <select
                        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 font-sans text-body-sm"
                        value={commodityGroup}
                        onChange={(event) => setCommodityGroup(event.target.value)}
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
                        setStartDate("");
                        setEndDate("");
                        setSelectedReportTypeId(defaultTypeId);
                        setSelectedExportFormat(defaultFormatLabel);
                        setCommodityGroup(DEFAULT_CATEGORIES[0].value);
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
