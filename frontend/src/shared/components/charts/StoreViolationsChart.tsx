"use client";

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { StoreViolationPoint } from "@/shared/types/dashboard.types";
import { hexToRgba, readToken } from "@/shared/utils/chart-tokens";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// Mirrors DASHBOARD_CHART_LIMIT (backend, dashboard.service.ts) — past a
// dozen or so bars in a fixed-height chart, Chart.js starts silently dropping
// alternating axis labels (found 2026-09-03). The table below the chart is
// not capped, since it scrolls instead of overflowing.
const CHART_STORE_LIMIT = 10;

type StoreViolationsChartProps = {
  points: StoreViolationPoint[];
  isLoading?: boolean;
  error?: string | null;
};

export function StoreViolationsChart({ points, isLoading, error }: StoreViolationsChartProps) {
  const errorColor = readToken("--color-error", "#ba1a1a");
  const successColor = readToken("--color-success", "#2e7d32");
  const surfaceLowest = readToken("--color-surface-container-lowest", "#ffffff");
  const onSurface = readToken("--color-on-surface", "#191b23");
  const onSurfaceVariant = readToken("--color-on-surface-variant", "#434655");
  const primaryFixed = readToken("--color-primary-fixed", "#dbe1ff");
  const outline = readToken("--color-outline", "#737686");

  const charted = points.slice(0, CHART_STORE_LIMIT);

  const chartData = {
    labels: charted.map((point) => point.storeName),
    datasets: [
      {
        label: "Violations",
        data: charted.map((point) => point.violationCount),
        backgroundColor: charted.map((point) =>
          hexToRgba(point.violationCount > 0 ? errorColor : successColor, 0.75),
        ),
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: surfaceLowest,
        titleColor: onSurface,
        bodyColor: onSurfaceVariant,
        borderColor: primaryFixed,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: { dataIndex: number; parsed: { y: number | null } }) => {
            const point = charted[context.dataIndex];
            return `${context.parsed.y} of ${point?.totalRecords ?? 0} records above SRP`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: outline, font: { size: 10 }, maxRotation: 30, minRotation: 0 },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        ticks: { color: outline, font: { size: 11 }, precision: 0 },
        grid: { color: hexToRgba(outline, 0.12) },
        border: { display: false },
      },
    },
  };

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
      <div className="mb-6 flex flex-col gap-1">
        <h4 className="font-sans text-h3-desktop text-on-surface">Violations by Store</h4>
        <p className="text-body-sm text-on-surface-variant">
          {points.length > CHART_STORE_LIMIT
            ? `The ${CHART_STORE_LIMIT} stores with the most SRP violations over the last 30 days.`
            : "Number of price records recorded above SRP over the last 30 days, per store."}
        </p>
      </div>

      {error ? (
        <p className="flex h-72 items-center justify-center text-body-sm text-error">{error}</p>
      ) : isLoading ? (
        <div className="h-72 animate-pulse rounded-xl bg-surface-container" />
      ) : charted.length === 0 ? (
        <p className="flex h-72 items-center justify-center text-body-sm text-on-surface-variant">
          No price records with a store attached in the last 30 days.
        </p>
      ) : (
        <div className="relative h-72">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </section>
  );
}
