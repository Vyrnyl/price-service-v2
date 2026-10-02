"use client";

import { Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import type { SrpHistoryEntry } from "@/shared/types/srp-history.types";
import { hexToRgba, readToken } from "@/shared/utils/chart-tokens";
import { formatCurrency } from "@/shared/utils/currency";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Filler);

type SrpHistoryChartProps = {
  /** Oldest first. */
  entries: SrpHistoryEntry[];
  /** Window to draw, as timestamps. The caller owns "now" so rendering stays pure. */
  rangeStart: number;
  rangeEnd: number;
  /**
   * Estimated SRP at a future date, drawn as a dashed line from the window's
   * end. Pass it only when the window ends today — a projection hanging off a
   * past window would read as a forecast made back then.
   */
  projection?: { x: number; y: number } | null;
};

type ChartPoint = { x: number; y: number; isRevision: boolean; isProjection?: boolean };

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 182;

/**
 * Month-year ticks suit a multi-year history, but over a few weeks they repeat
 * ("Sep 2026, Sep 2026"), so a short span labels by day instead.
 */
function formatTick(timestamp: number, spanMs: number) {
  return new Date(timestamp).toLocaleDateString(
    "en-PH",
    spanMs < SIX_MONTHS_MS ? { month: "short", day: "numeric" } : { month: "short", year: "numeric" },
  );
}

function formatFullDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * The points to draw for one window. An SRP set before the window is still in
 * force inside it, so it is carried in at the window's start — otherwise a
 * one-month view with no revisions that month would look like "no SRP".
 * Likewise the latest SRP is carried to the window's end.
 */
export function buildSrpChartPoints(entries: SrpHistoryEntry[], rangeStart: number, rangeEnd: number): ChartPoint[] {
  const revisions = entries.map((entry) => ({
    x: new Date(entry.effectiveDate).getTime(),
    y: entry.price,
    isRevision: true,
  }));

  const inForceAtStart = [...revisions].reverse().find((point) => point.x < rangeStart);
  const inWindow = revisions.filter((point) => point.x >= rangeStart && point.x <= rangeEnd);
  const points: ChartPoint[] = [];

  if (inForceAtStart) {
    points.push({ x: rangeStart, y: inForceAtStart.y, isRevision: false });
  }
  points.push(...inWindow);

  const last = points[points.length - 1];
  if (last && last.x < rangeEnd) {
    points.push({ x: rangeEnd, y: last.y, isRevision: false });
  }

  return points;
}

/**
 * Plot area only — no card of its own, because it is always placed inside a
 * surface (the SRP history pop-up) that already provides one.
 *
 * The x-axis is real time (a linear scale over timestamps), not one slot per
 * revision: SRP changes are months apart and irregular, and evenly spaced
 * category labels would make a two-week SRP look as long-lived as a year-long one.
 */
export function SrpHistoryChart({ entries, rangeStart, rangeEnd, projection = null }: SrpHistoryChartProps) {
  const lineColor = readToken("--color-primary-container", "#2563eb");
  const surfaceLowest = readToken("--color-surface-container-lowest", "#ffffff");
  const onSurface = readToken("--color-on-surface", "#191b23");
  const onSurfaceVariant = readToken("--color-on-surface-variant", "#434655");
  const primaryFixed = readToken("--color-primary-fixed", "#dbe1ff");
  const outline = readToken("--color-outline", "#737686");

  const points = buildSrpChartPoints(entries, rangeStart, rangeEnd);
  const lastPoint = points[points.length - 1];
  const projectionPoints: ChartPoint[] =
    projection && lastPoint && projection.x > lastPoint.x
      ? [
          { x: lastPoint.x, y: lastPoint.y, isRevision: false },
          { x: projection.x, y: projection.y, isRevision: false, isProjection: true },
        ]
      : [];
  const axisEnd = projectionPoints.length > 0 ? projectionPoints[1].x : rangeEnd;
  const spanMs = axisEnd - rangeStart;

  if (points.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-center text-body-sm text-on-surface-variant sm:h-64">
        No SRP was in effect during this period.
      </p>
    );
  }

  const chartData = {
    datasets: [
      {
        label: "SRP",
        data: points,
        borderColor: lineColor,
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) {
            return hexToRgba(lineColor, 0.12);
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, hexToRgba(lineColor, 0.22));
          gradient.addColorStop(1, hexToRgba(lineColor, 0.02));
          return gradient;
        },
        borderWidth: 2.5,
        tension: 0.4,
        // Monotone keeps the smoothed curve from overshooting above or below the
        // real SRP values, so the line never shows a price DTI did not set.
        cubicInterpolationMode: "monotone" as const,
        fill: true,
        pointRadius: points.map((point) => (point.isRevision ? 4 : 0)),
        pointHoverRadius: points.map((point) => (point.isRevision ? 6 : 0)),
        pointBackgroundColor: surfaceLowest,
        pointBorderColor: lineColor,
        pointBorderWidth: 2,
        // A revision can sit exactly on the x-axis minimum; without this its
        // dot is cut in half by the chart area.
        clip: false as const,
      },
      {
        label: "Estimated SRP",
        data: projectionPoints,
        borderColor: lineColor,
        borderWidth: 2,
        borderDash: [6, 5],
        fill: false,
        pointRadius: projectionPoints.map((point) => (point.isProjection ? 4 : 0)),
        pointHoverRadius: projectionPoints.map((point) => (point.isProjection ? 6 : 0)),
        pointBackgroundColor: surfaceLowest,
        pointBorderColor: lineColor,
        pointBorderWidth: 2,
        clip: false as const,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false as const,
    layout: { padding: { left: 6, right: 6 } },
    interaction: { mode: "nearest" as const, intersect: false, axis: "x" as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: surfaceLowest,
        titleColor: onSurface,
        bodyColor: onSurfaceVariant,
        borderColor: primaryFixed,
        borderWidth: 1,
        padding: 10,
        filter: (item: { raw: unknown }) => {
          const point = item.raw as ChartPoint;
          return point.isRevision || Boolean(point.isProjection);
        },
        callbacks: {
          title: (items: { raw: unknown }[]) => {
            if (items.length === 0) return "";
            const point = items[0].raw as ChartPoint;
            return `${point.isProjection ? "Projected for" : "Effective"} ${formatFullDate(point.x)}`;
          },
          label: (item: { raw: unknown }) => {
            const point = item.raw as ChartPoint;
            return `${point.isProjection ? "Estimated SRP" : "SRP"} ${formatCurrency(point.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear" as const,
        min: rangeStart,
        max: axisEnd,
        ticks: {
          color: outline,
          maxTicksLimit: 5,
          font: { size: 11 },
          callback: (value: number | string) => formatTick(Number(value), spanMs),
        },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        grace: "15%",
        ticks: {
          color: outline,
          font: { size: 11 },
          maxTicksLimit: 5,
          callback: (value: number | string) => formatCurrency(Number(value)),
        },
        grid: { color: hexToRgba(outline, 0.12) },
        border: { display: false },
      },
    },
  };

  return (
    <div className="relative h-56 sm:h-64">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
