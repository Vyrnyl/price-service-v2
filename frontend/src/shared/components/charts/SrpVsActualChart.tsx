"use client";

import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { SrpVsActualPoint } from "@/shared/types/dashboard.types";
import { hexToRgba, readToken } from "@/shared/utils/chart-tokens";
import { formatCurrency } from "@/shared/utils/currency";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type SrpVsActualChartProps = {
  points: SrpVsActualPoint[];
  isLoading?: boolean;
  error?: string | null;
};

export function SrpVsActualChart({ points, isLoading, error }: SrpVsActualChartProps) {
  const srpColor = readToken("--color-outline", "#737686");
  const successColor = readToken("--color-success", "#2e7d32");
  const errorColor = readToken("--color-error", "#ba1a1a");
  const surfaceLowest = readToken("--color-surface-container-lowest", "#ffffff");
  const onSurface = readToken("--color-on-surface", "#191b23");
  const onSurfaceVariant = readToken("--color-on-surface-variant", "#434655");
  const primaryFixed = readToken("--color-primary-fixed", "#dbe1ff");
  const outline = readToken("--color-outline", "#737686");

  const chartData = {
    labels: points.map((point) => point.commodityName),
    datasets: [
      {
        label: "SRP",
        data: points.map((point) => point.srp),
        backgroundColor: hexToRgba(srpColor, 0.5),
        borderRadius: 6,
        maxBarThickness: 22,
      },
      {
        label: "Actual average",
        data: points.map((point) => point.actualAverage),
        backgroundColor: points.map((point) =>
          hexToRgba(point.actualAverage > point.srp ? errorColor : successColor, 0.75),
        ),
        borderRadius: 6,
        maxBarThickness: 22,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: { color: onSurfaceVariant, boxWidth: 12, boxHeight: 12, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: surfaceLowest,
        titleColor: onSurface,
        bodyColor: onSurfaceVariant,
        borderColor: primaryFixed,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
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
        ticks: { color: outline, font: { size: 11 }, callback: (value: number | string) => formatCurrency(Number(value)) },
        grid: { color: hexToRgba(outline, 0.12) },
        border: { display: false },
      },
    },
  };

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
      <div className="mb-6 flex flex-col gap-1">
        <h4 className="font-sans text-h3-desktop text-on-surface">SRP vs. Actual Price</h4>
        <p className="text-body-sm text-on-surface-variant">
          The {points.length} commodities furthest above Suggested Retail Price — red bars are
          trading above SRP.
        </p>
      </div>

      {error ? (
        <p className="flex h-72 items-center justify-center text-body-sm text-error">{error}</p>
      ) : isLoading ? (
        <div className="h-72 animate-pulse rounded-xl bg-surface-container" />
      ) : points.length === 0 ? (
        <p className="flex h-72 items-center justify-center text-body-sm text-on-surface-variant">
          No SRP comparisons available yet.
        </p>
      ) : (
        <div className="relative h-72">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </section>
  );
}
