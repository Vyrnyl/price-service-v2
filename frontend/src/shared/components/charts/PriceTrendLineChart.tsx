"use client";

import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import type { PriceTrendPoint } from "@/shared/types/dashboard.types";
import { hexToRgba, readToken } from "@/shared/utils/chart-tokens";
import { formatCurrency } from "@/shared/utils/currency";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

type PriceTrendLineChartProps = {
  points: PriceTrendPoint[];
  isLoading?: boolean;
  error?: string | null;
};

export function PriceTrendLineChart({ points, isLoading, error }: PriceTrendLineChartProps) {
  const lineColor = readToken("--color-primary-container", "#2563eb");
  const surfaceLowest = readToken("--color-surface-container-lowest", "#ffffff");
  const onSurface = readToken("--color-on-surface", "#191b23");
  const onSurfaceVariant = readToken("--color-on-surface-variant", "#434655");
  const primaryFixed = readToken("--color-primary-fixed", "#dbe1ff");
  const outline = readToken("--color-outline", "#737686");

  const chartData = {
    labels: points.map((point) =>
      new Date(point.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
    ),
    datasets: [
      {
        label: "Average price",
        data: points.map((point) => point.averagePrice),
        borderColor: lineColor,
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) {
            return hexToRgba(lineColor, 0.14);
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, hexToRgba(lineColor, 0.28));
          gradient.addColorStop(1, hexToRgba(lineColor, 0.04));
          return gradient;
        },
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: surfaceLowest,
        pointBorderColor: lineColor,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
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
          label: (context: { parsed: { y: number | null } }) => formatCurrency(context.parsed.y),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: outline, maxTicksLimit: 6, autoSkip: true, font: { size: 11 } },
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
        <h4 className="font-sans text-h3-desktop text-on-surface">Market Price Trend</h4>
        <p className="text-body-sm text-on-surface-variant">Average recorded price across all commodities, last 30 days.</p>
      </div>

      {error ? (
        <p className="flex h-60 items-center justify-center text-body-sm text-error">{error}</p>
      ) : isLoading ? (
        <div className="h-60 animate-pulse rounded-xl bg-surface-container" />
      ) : points.length === 0 ? (
        <p className="flex h-60 items-center justify-center text-body-sm text-on-surface-variant">
          No price records yet — the trend will appear once prices are recorded.
        </p>
      ) : (
        <div className="relative h-60 sm:h-72">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </section>
  );
}
