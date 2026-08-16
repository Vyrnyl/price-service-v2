"use client";

import { useMemo, useState } from "react";
import { MdOutlineVisibility } from "react-icons/md";
import Badge from "@/shared/components/Badge";
import Pagination from "@/shared/components/Pagination";
import { ACTION_BADGE_VARIANT, ACTION_LABELS } from "../constants/audit-log.constants";
import type { AuditLogEntry } from "../types/audit-log.types";

type AuditLogTableProps = {
  entries: AuditLogEntry[];
  isLoading?: boolean;
  error?: string | null;
  onViewDetails: (entry: AuditLogEntry) => void;
};

const PAGE_SIZE = 10;

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTarget(targetId: string | null) {
  if (!targetId) return "—";
  return targetId.length > 13 ? `${targetId.slice(0, 8)}…${targetId.slice(-4)}` : targetId;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AuditLogTable({ entries, isLoading, error, onViewDetails }: AuditLogTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEntries = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return entries.slice(startIndex, startIndex + PAGE_SIZE);
  }, [safeCurrentPage, entries]);

  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(startIndex + paginatedEntries.length - 1, entries.length);

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow">
      {error ? (
        <p className="flex h-40 items-center justify-center px-6 text-body-sm text-error">{error}</p>
      ) : isLoading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }, (_, index) => index).map((row) => (
            <div key={row} className="h-12 animate-pulse rounded-lg bg-surface-container" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="flex h-40 items-center justify-center px-6 text-center text-body-sm text-on-surface-variant">
          No audit activity found for the current filters.
        </p>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    <th className="px-6 py-4 text-label-caps uppercase text-outline">Timestamp</th>
                    <th className="px-6 py-4 text-label-caps uppercase text-outline">Actor</th>
                    <th className="px-6 py-4 text-label-caps uppercase text-outline">Action</th>
                    <th className="px-6 py-4 text-label-caps uppercase text-outline">Target</th>
                    <th className="px-6 py-4 text-right text-label-caps uppercase text-outline">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {paginatedEntries.map((entry) => (
                    <tr key={entry.id} className="group transition-colors">
                      <td className="px-6 py-4 text-body-sm text-on-surface-variant">
                        {formatTimestamp(entry.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-bold text-primary">
                            {getInitials(entry.actorName)}
                          </div>
                          <div>
                            <p className="text-body-sm font-semibold leading-none text-on-surface">
                              {entry.actorName}
                            </p>
                            <p className="mt-1 text-body-xs text-outline">{entry.actorEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={ACTION_BADGE_VARIANT[entry.action]}>{ACTION_LABELS[entry.action]}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-body-sm text-on-surface-variant" title={entry.targetId ?? undefined}>
                        {formatTarget(entry.targetId)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="rounded-lg p-2 opacity-60 transition-opacity hover:bg-surface-container-high hover:text-on-surface group-hover:opacity-100"
                          title="View details"
                          onClick={() => onViewDetails(entry)}
                        >
                          <MdOutlineVisibility size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {paginatedEntries.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-bold text-primary">
                      {getInitials(entry.actorName)}
                    </div>
                    <div>
                      <p className="text-body-sm font-semibold text-on-surface">{entry.actorName}</p>
                      <p className="mt-1 text-body-xs text-outline">{entry.actorEmail}</p>
                    </div>
                  </div>
                  <Badge variant={ACTION_BADGE_VARIANT[entry.action]}>{ACTION_LABELS[entry.action]}</Badge>
                </div>

                <p className="mt-3 text-body-xs text-outline">{formatTimestamp(entry.createdAt)}</p>

                <div className="mt-4 flex items-center justify-end">
                  <button
                    className="rounded-lg border border-outline-variant bg-surface-container-lowest p-2.5 transition-colors hover:bg-surface-container-high"
                    title="View details"
                    onClick={() => onViewDetails(entry)}
                  >
                    <MdOutlineVisibility size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm text-on-surface-variant">
              Showing {entries.length === 0 ? 0 : `${startIndex}-${endIndex}`} of {entries.length} entries
            </p>
            <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </>
      )}
    </div>
  );
}
