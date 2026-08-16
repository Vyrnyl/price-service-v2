"use client";

import { useEffect, useState } from "react";
import PageShell from "@/shared/components/PageShell";
import { fetchAuditLogs } from "../services/audit-log.service";
import AuditLogFilters from "../components/AuditLogFilters";
import AuditLogTable from "../components/AuditLogTable";
import AuditLogDetailModal from "../components/AuditLogDetailModal";
import type { AuditAction, AuditLogEntry } from "../types/audit-log.types";

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const data = await fetchAuditLogs();
        setEntries(data);
      } catch (loadError) {
        console.error("Failed to load audit logs", loadError);
        setError("Unable to load audit log entries right now.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadAuditLogs();
  }, []);

  const filteredEntries = entries.filter((entry) => {
    const haystack = `${entry.actorName} ${entry.actorEmail}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "ALL" || entry.action === actionFilter;
    const entryDate = entry.createdAt.slice(0, 10);
    const matchesFrom = !dateFrom || entryDate >= dateFrom;
    const matchesTo = !dateTo || entryDate <= dateTo;

    return matchesSearch && matchesAction && matchesFrom && matchesTo;
  });

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
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            actionFilter={actionFilter}
            onActionFilterChange={setActionFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
          />

          <AuditLogTable
            entries={filteredEntries}
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
