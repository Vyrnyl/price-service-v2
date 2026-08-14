"use client";

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { CommodityComparisonPoint } from "@/shared/types/dashboard.types";
import { hexToRgba, readToken } from "@/shared/utils/chart-tokens";
import { formatCurrency } from "@/shared/utils/currency";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type CommodityComparisonChartProps = {
  points: CommodityComparisonPoint[];
  isLoading?: boolean;
  error?: string | null;
};

export function CommodityComparisonChart({ points, isLoading, error }: CommodityComparisonChartProps) {
  const barColor = readToken("--color-secondary", "#5b5f76");
  const surfaceLowest = readToken("--color-surface-container-lowest", "#ffffff");
  const onSurface = readToken("--color-on-surface", "#191b23");
  const onSurfaceVariant = readToken("--color-on-surface-variant", "#434655");
  const primaryFixed = readToken("--color-primary-fixed", "#dbe1ff");
  const outline = readToken("--color-outline", "#737686");

  const chartData = {
    labels: points.map((point) => point.commodityName),
    datasets: [
      {
        label: "Average price",
        data: points.map((point) => point.averagePrice),
        backgroundColor: hexToRgba(barColor, 0.75),
        hoverBackgroundColor: barColor,
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
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
          label: (context: { parsed: { x: number | null } }) => formatCurrency(context.parsed.x),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: outline, font: { size: 11 }, callback: (value: number | string) => formatCurrency(Number(value)) },
        grid: { color: hexToRgba(outline, 0.12) },
        border: { display: false },
      },
      y: {
        ticks: { color: onSurfaceVariant, font: { size: 11 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 data-card-shadow md:p-8">
      <div className="mb-6 flex flex-col gap-1">
        <h4 className="font-h3-desktop text-h3-desktop text-on-surface">Commodity Comparison</h4>
        <p className="text-body-sm text-on-surface-variant">Average recorded price per commodity.</p>
      </div>

      {error ? (
        <p className="flex h-72 items-center justify-center text-body-sm text-error">{error}</p>
      ) : isLoading ? (
        <div className="h-72 animate-pulse rounded-xl bg-surface-container" />
      ) : points.length === 0 ? (
        <p className="flex h-72 items-center justify-center text-body-sm text-on-surface-variant">
          No commodities have recorded prices yet.
        </p>
      ) : (
        <div className="relative h-72">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </section>
  );
}
