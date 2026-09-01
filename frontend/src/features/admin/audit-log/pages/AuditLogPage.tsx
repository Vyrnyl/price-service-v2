"use client";

import { useEffect, useState } from "react";
import PageShell from "@/shared/components/PageShell";
import { fetchAuditLogs } from "../services/audit-log.service";
import AuditLogFilters from "../components/AuditLogFilters";
import AuditLogTable from "../components/AuditLogTable";
import AuditLogDetailModal from "../components/AuditLogDetailModal";
import type { AuditAction, AuditLogEntry } from "../types/audit-log.types";

const PAGE_SIZE = 10;

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    async function loadAuditLogs() {
      setIsLoading(true);
      try {
        const response = await fetchAuditLogs({
          page: currentPage,
          pageSize: PAGE_SIZE,
          action: actionFilter !== "ALL" ? actionFilter : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        setEntries(response.data);
        setTotal(response.total);
        setError(null);
      } catch (loadError) {
        console.error("Failed to load audit logs", loadError);
        setError("Unable to load audit log entries right now.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadAuditLogs();
  }, [currentPage, actionFilter, dateFrom, dateTo]);

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-8 sm:py-10 md:px-container-margin-desktop md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="font-sans text-h1-desktop text-on-surface mobile:font-sans mobile:text-h1-mobile">
              Audit Log
            </h1>
            <p className="mt-1 text-body-lg text-on-surface-variant">
              A queryable record of critical actions — logins, user management, SRP changes, and price record
              deletions.
            </p>
          </div>

          <AuditLogFilters
            actionFilter={actionFilter}
            onActionFilterChange={(value) => {
              setActionFilter(value);
              setCurrentPage(1);
            }}
            dateFrom={dateFrom}
            onDateFromChange={(value) => {
              setDateFrom(value);
              setCurrentPage(1);
            }}
            dateTo={dateTo}
            onDateToChange={(value) => {
              setDateTo(value);
              setCurrentPage(1);
            }}
          />

          <AuditLogTable
            entries={entries}
            total={total}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            error={error}
            onViewDetails={setSelectedEntry}
          />
        </div>
      </section>

      <AuditLogDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </PageShell>
  );
}
