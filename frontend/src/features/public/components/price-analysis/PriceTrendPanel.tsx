"use client";

import { useEffect, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import Input from "@/shared/components/Input";

type PriceRange = "Week" | "Month" | "3M" | "6M" | "1Y" | "Custom";

export type TrendPoint = {
  date: string | null;
  price: number | null;
  label: string;
  x: number;
  y: number;
};

type PriceInsight = {
  title: string;
  price: string;
  change: string;
  /** `null` while the forecast is loading or unavailable — the label is then omitted. */
  confidence: string | null;
  path: string;
  labels: string[];
};

type PriceTrendPanelProps = {
  activeInsight: PriceInsight;
  activeRange: PriceRange;
  rangeOptions: readonly PriceRange[];
  rangeLabels: Record<PriceRange, string>;
  points: TrendPoint[];
  selectedPointIndex: number | null;
  customStartDate: string;
  customEndDate: string;
  onRangeChange: (range: PriceRange) => void;
  onCustomStartDateChange: (value: string) => void;
  onCustomEndDateChange: (value: string) => void;
  onPointSelect: (index: number) => void;
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function readToken(name: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function hexToRgba(hex: string, alpha: number) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) {
    return hex;
  }

  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function PriceTrendPanel({
  activeInsight,
  activeRange,
  rangeOptions,
  rangeLabels,
  points,
  selectedPointIndex,
  customStartDate,
  customEndDate,
  onRangeChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onPointSelect,
}: PriceTrendPanelProps) {
  const [isCompactScreen, setIsCompactScreen] = useState(false);

  useEffect(() => {
    const updateCompactScreen = () => {
      setIsCompactScreen(window.innerWidth < 640);
    };

    updateCompactScreen();
    window.addEventListener("resize", updateCompactScreen);

    return () => window.removeEventListener("resize", updateCompactScreen);
  }, []);

  const selectedPoint =
    selectedPointIndex != null && points[selectedPointIndex]
      ? points[selectedPointIndex]
      : points[points.length - 1] ?? null;

  const selectedDateLabel = selectedPoint?.date
    ? new Date(selectedPoint.date).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No date available";

  const lineColor = readToken("--color-primary-container", "#2563eb");
  const selectedPointColor = readToken("--color-primary-fixed", "#dbe1ff");
  const surfaceLowest = readToken("--color-surface-container-lowest", "#ffffff");
  const onSurface = readToken("--color-on-surface", "#191b23");
  const onSurfaceVariant = readToken("--color-on-surface-variant", "#434655");
  const primaryFixed = readToken("--color-primary-fixed", "#dbe1ff");
  const outline = readToken("--color-outline", "#737686");

  const chartData = {
    labels: points.map((point) => {
      if (!point.date) {
        return point.label;
      }

      return new Date(point.date).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
    }),
    datasets: [
      {
        label: activeInsight.title,
        data: points.map((point) => point.price),
        borderColor: lineColor,
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

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
        pointRadius: points.map((_, index) => (selectedPointIndex === index ? 6 : 4)),
        pointHoverRadius: 6,
        pointBackgroundColor: points.map((_, index) => (selectedPointIndex === index ? selectedPointColor : surfaceLowest)),
        pointBorderColor: lineColor,
        pointBorderWidth: points.map((_, index) => (selectedPointIndex === index ? 3 : 2)),
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: isCompactScreen ? 220 : 420,
      easing: "easeOutCubic" as const,
    },
    layout: {
      padding: {
        top: 8,
        right: isCompactScreen ? 4 : 8,
        bottom: 0,
        left: isCompactScreen ? 4 : 8,
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: surfaceLowest,
        titleColor: onSurface,
        bodyColor: onSurfaceVariant,
        borderColor: primaryFixed,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: { parsed: { y: number | null } }) =>
            formatCurrency(context.parsed.y),
        },
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          color: outline,
          maxTicksLimit: isCompactScreen ? 4 : 6,
          autoSkip: true,
          autoSkipPadding: 10,
          font: {
            size: isCompactScreen ? 10 : 11,
          },
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    onClick: (_: unknown, elements: Array<{ index: number }>) => {
      if (elements[0]?.index != null) {
        onPointSelect(elements[0].index);
      }
    },
  };

  return (
    <section className="rounded-xl border border-outline-variant/80 bg-linear-to-br from-surface-container-lowest to-surface-container p-4 data-card-shadow sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline">Price trend</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-on-surface">{activeInsight.title}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {activeInsight.change}
            {activeInsight.confidence ? ` • ${activeInsight.confidence} confidence` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {rangeOptions.map((range) => (
            <button
              key={range}
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                activeRange === range
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
              onClick={() => onRangeChange(range)}
            >
              {rangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {activeRange === "Custom" ? (
        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-outline-variant/70 bg-surface-container p-3 sm:flex-row sm:items-center sm:gap-3">
          <label className="flex flex-1 items-center gap-2 text-sm text-on-surface-variant">
            From
            <Input
              type="date"
              max={customEndDate}
              value={customStartDate}
              onChange={(event) => onCustomStartDateChange(event.target.value)}
              aria-label="Custom range start date"
            />
          </label>
          <label className="flex flex-1 items-center gap-2 text-sm text-on-surface-variant">
            To
            <Input
              type="date"
              min={customStartDate}
              max={new Date().toISOString().slice(0, 10)}
              value={customEndDate}
              onChange={(event) => onCustomEndDateChange(event.target.value)}
              aria-label="Custom range end date"
            />
          </label>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container p-3 shadow-inner sm:p-4">
        <div className="relative h-60 sm:h-70 md:h-80 lg:h-90">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={line} className="w-full border-t border-surface-variant/80" />
            ))}
          </div>

          <div className="relative h-full w-full">
            <Line data={chartData} options={chartOptions} />
          </div>

          {points.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest px-4 py-2 text-sm text-on-surface-variant shadow-sm">
                No price records in this range.
              </p>
            </div>
          ) : (
            <div className="mt-3 w-full rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-3 data-card-shadow sm:absolute sm:inset-x-3 sm:bottom-3 sm:mt-0 sm:w-auto sm:max-w-56 md:left-[60%] md:right-auto md:top-4 md:bottom-auto md:max-w-60">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-outline">Selected point</p>
              <p className="text-lg font-semibold text-on-surface sm:text-xl">{selectedPoint ? formatCurrency(selectedPoint.price) : activeInsight.price}</p>
              <p className="text-sm text-success">{selectedDateLabel}</p>
            </div>
          )}
        </div>

        {activeInsight.labels.length <= 31 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeInsight.labels.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
