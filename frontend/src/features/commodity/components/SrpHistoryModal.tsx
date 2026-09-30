"use client";

import { useState } from "react";
import { MdArrowDownward, MdArrowUpward, MdClose } from "react-icons/md";
import Alert from "@/shared/components/Alert";
import Badge from "@/shared/components/Badge";
import Button from "@/shared/components/Button";
import Input from "@/shared/components/Input";
import Modal from "@/shared/components/Modal";
import Skeleton from "@/shared/components/Skeleton";
import { SrpHistoryChart } from "@/shared/components/charts/SrpHistoryChart";
import type { SrpHistoryEntry } from "@/shared/types/srp-history.types";
import { formatCurrency } from "@/shared/utils/currency";

type SrpHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  commodityName: string;
  category?: string;
  /** Oldest first. */
  entries: SrpHistoryEntry[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function formatSignedCurrency(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

function percentChange(from: number, to: number) {
  return from === 0 ? null : ((to - from) / from) * 100;
}

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-high p-3 sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline">{label}</p>
      <p className="mt-1 text-xl font-semibold text-on-surface sm:mt-2 sm:text-2xl">{value}</p>
      <p className="mt-1 text-sm text-on-surface-variant">{detail}</p>
    </div>
  );
}

/** Direction of a revision, told by an arrow plus words so it never relies on colour. */
function ChangeLabel({ previous, current }: { previous: number; current: number }) {
  const difference = current - previous;
  const percent = percentChange(previous, current);

  if (difference === 0) {
    return <span className="text-xs text-on-surface-variant">No change</span>;
  }

  const Icon = difference > 0 ? MdArrowUpward : MdArrowDownward;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
      <Icon size={14} aria-hidden="true" />
      <span className="sr-only">{difference > 0 ? "Raised" : "Lowered"} by</span>
      {formatSignedCurrency(difference)}
      {percent != null ? ` (${formatSignedPercent(percent)})` : ""}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading SRP history">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-xl border border-outline-variant bg-surface-container-high p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64" />
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-12" />
        ))}
      </div>
    </div>
  );
}

/** Same range pills as Price Trends, minus "Week" (SRPs are not revised week to week) plus "All". */
type SrpRangeKey = "Month" | "3M" | "6M" | "1Y" | "All" | "Custom";

const SRP_RANGES: { key: SrpRangeKey; label: string; days: number | null; description: string }[] = [
  { key: "Month", label: "Month", days: 30, description: "Last 30 days" },
  { key: "3M", label: "3M", days: 90, description: "Last 3 months" },
  { key: "6M", label: "6M", days: 182, description: "Last 6 months" },
  { key: "1Y", label: "1Y", days: 365, description: "Last 12 months" },
  { key: "All", label: "All", days: null, description: "Full history" },
  { key: "Custom", label: "Custom", days: null, description: "Custom range" },
];

const DAY_MS = 1000 * 60 * 60 * 24;

function toDateInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** A bare `YYYY-MM-DD` read as local time; the end bound takes that day's last instant so the day itself is included. */
function parseDateInputValue(value: string, endOfDay: boolean) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
    : new Date(year, month - 1, day).getTime();
}

function SrpChartPanel({ entries }: { entries: SrpHistoryEntry[] }) {
  // Read once per mount so re-renders don't move the window.
  const [now] = useState(() => Date.now());
  const [activeRange, setActiveRange] = useState<SrpRangeKey>("All");
  const [customStart, setCustomStart] = useState(() => toDateInputValue(Date.now() - 90 * DAY_MS));
  const [customEnd, setCustomEnd] = useState(() => toDateInputValue(Date.now()));

  const descriptor = SRP_RANGES.find((range) => range.key === activeRange) ?? SRP_RANGES[4];
  const firstEffective = new Date(entries[0].effectiveDate).getTime();

  let rangeStart: number;
  let rangeEnd = now;
  if (activeRange === "All") {
    rangeStart = Math.min(firstEffective, now);
  } else if (activeRange === "Custom") {
    rangeStart = parseDateInputValue(customStart, false) ?? now - 90 * DAY_MS;
    rangeEnd = Math.min(parseDateInputValue(customEnd, true) ?? now, now);
  } else {
    rangeStart = now - (descriptor.days ?? 0) * DAY_MS;
  }

  const revisionsInRange = entries.filter((entry) => {
    const effective = new Date(entry.effectiveDate).getTime();
    return effective >= rangeStart && effective <= rangeEnd;
  }).length;
  const hadSrpBeforeRange = firstEffective < rangeStart;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-on-surface">SRP over time</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">{descriptor.description}</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
          {SRP_RANGES.map((range) => (
            <button
              key={range.key}
              type="button"
              aria-pressed={activeRange === range.key}
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
      </div>

      {activeRange === "Custom" ? (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-outline-variant/70 bg-surface-container p-3 sm:flex-row sm:items-center sm:gap-3">
          <label className="flex flex-1 items-center gap-2 text-sm text-on-surface-variant">
            From
            <Input
              type="date"
              max={customEnd}
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              aria-label="Custom range start date"
            />
          </label>
          <label className="flex flex-1 items-center gap-2 text-sm text-on-surface-variant">
            To
            <Input
              type="date"
              min={customStart}
              max={toDateInputValue(now)}
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
              aria-label="Custom range end date"
            />
          </label>
        </div>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-outline">
        Each dot marks a date DTI set a new SRP. The line is smoothed to show the direction of change — the SRP itself
        only changes on those dates.
      </p>
      {revisionsInRange === 0 && hadSrpBeforeRange ? (
        <p className="mt-1 text-xs leading-5 text-on-surface-variant">
          No SRP changes in this period — the line shows the SRP that was already in force.
        </p>
      ) : null}

      <div className="mt-4">
        <SrpHistoryChart entries={entries} rangeStart={rangeStart} rangeEnd={rangeEnd} />
      </div>
    </div>
  );
}

function SummaryTiles({ entries }: { entries: SrpHistoryEntry[] }) {
  const first = entries[0];
  const current = entries[entries.length - 1];
  const changeCount = entries.length - 1;
  const totalChange = current.price - first.price;
  const totalPercent = percentChange(first.price, current.price);

  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      <StatTile
        label="Current SRP"
        value={formatCurrency(current.price)}
        detail={`In effect since ${formatDate(current.effectiveDate)}`}
      />
      <StatTile
        label="Total SRP change"
        value={changeCount === 0 ? "—" : formatSignedCurrency(totalChange)}
        detail={
          changeCount === 0
            ? "Only one SRP so far"
            : `${totalPercent != null ? `${formatSignedPercent(totalPercent)} ` : ""}since ${formatDate(first.effectiveDate)}`
        }
      />
      <StatTile
        label="No. of changes"
        value={String(changeCount)}
        detail={changeCount === 0 ? "SRP not changed yet" : `Last changed ${formatDate(current.effectiveDate)}`}
      />
    </div>
  );
}

function HistoryBody({ entries }: { entries: SrpHistoryEntry[] }) {
  // Read once per mount so re-renders don't reclassify an entry mid-view.
  const [now] = useState(() => Date.now());
  // An SRP can be recorded up to a few days ahead of its effective date. It is
  // listed as scheduled, but the tiles and chart describe only what is in force.
  const inEffect = entries.filter((entry) => new Date(entry.effectiveDate).getTime() <= now);
  const currentId = inEffect[inEffect.length - 1]?.id;
  const newestFirst = [...entries].reverse();

  return (
    <div className="space-y-6">
      {inEffect.length > 0 ? (
        <>
          <SummaryTiles entries={inEffect} />
          <SrpChartPanel entries={inEffect} />
        </>
      ) : (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-center">
          <p className="text-sm font-semibold text-on-surface">No SRP in effect yet</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            The first SRP for this item takes effect on {formatDate(entries[0].effectiveDate)}.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
        <p className="text-sm font-semibold text-on-surface">Change history</p>
        {entries.length === 1 ? (
          <p className="mt-1 text-xs leading-5 text-outline">
            This is the first SRP on record. Later changes will be listed here as DTI sets them.
          </p>
        ) : null}
        {/* Own scroll area so a long-revised commodity doesn't push the chart off screen. Focusable so it
            can be scrolled from the keyboard. */}
        <ul
          tabIndex={0}
          aria-label="SRP changes, newest first"
          className="scrollbar-none mt-3 max-h-60 divide-y divide-outline-variant overflow-y-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {newestFirst.map((entry, index) => {
            const previous = newestFirst[index + 1];
            const isScheduled = new Date(entry.effectiveDate).getTime() > now;
            return (
              <li key={entry.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-on-surface">{formatDate(entry.effectiveDate)}</p>
                    {entry.id === currentId ? <Badge variant="primary">Current</Badge> : null}
                    {isScheduled ? <Badge variant="info">Scheduled</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-xs text-outline">Effective date</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-on-surface">{formatCurrency(entry.price)}</p>
                  {previous ? (
                    <ChangeLabel previous={previous.price} current={entry.price} />
                  ) : (
                    <span className="text-xs text-on-surface-variant">First recorded</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function SrpHistoryModal({
  open,
  onClose,
  commodityName,
  category,
  entries,
  isLoading = false,
  error = null,
  onRetry,
}: SrpHistoryModalProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-3xl">
      {/* The shared Modal does not scroll; this keeps the log reachable at phone heights. */}
      <div className="scrollbar-none max-h-[calc(100dvh-6rem)] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline">SRP history</p>
            <h3 id="srp-history-title" className="mt-1 text-2xl font-semibold text-on-surface">
              {commodityName}
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Every Suggested Retail Price DTI has set for this item, and when each one took effect.
            </p>
            {category ? (
              <span className="mt-3 inline-block rounded-md bg-surface-variant px-2.5 py-1 text-xs text-on-surface-variant">
                {category}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close SRP history"
            className="shrink-0 rounded-full bg-surface-container-high p-2 text-on-surface-variant transition-colors hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={onClose}
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <Alert variant="error" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              {onRetry ? (
                <Button variant="secondary" size="sm" onClick={onRetry} className="self-start sm:self-auto">
                  Try again
                </Button>
              ) : null}
            </Alert>
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-center">
              <p className="text-sm font-semibold text-on-surface">No SRP on record yet</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                DTI has not set a Suggested Retail Price for this item in the system, so there is no history to show.
              </p>
            </div>
          ) : (
            <HistoryBody entries={entries} />
          )}
        </div>
      </div>
    </Modal>
  );
}
