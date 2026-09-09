"use client";

import { useEffect, useState } from "react";
import {
  MdBarChart,
  MdMonetizationOn,
  MdTrendingUp,
  MdVerified,
} from "react-icons/md";
import {
  getPublicCommodities,
  getPublicForecastByCommodityId,
  type PublicCommodityItem,
} from "@/features/commodity";
import PageShell from "@/shared/components/PageShell";
import { DailyChangesPanel } from "../components/price-analysis/DailyChangesPanel";
import { ForecastDetailModal } from "../components/price-analysis/ForecastDetailModal";
import { ForecastMethodPanel } from "../components/price-analysis/ForecastMethodPanel";
import { ForecastSummaryPanel } from "../components/price-analysis/ForecastSummaryPanel";
import { PriceAnalysisHeader } from "../components/price-analysis/PriceAnalysisHeader";
import { PriceAnalysisSummaryCards } from "../components/price-analysis/PriceAnalysisSummaryCards";
import { PriceTrendPanel } from "../components/price-analysis/PriceTrendPanel";

type RangeKey = "Week" | "Month" | "3M" | "6M" | "1Y" | "Custom";

type RangeDescriptor = {
  key: RangeKey;
  label: string;
  /** Rolling window length in days. `null` for "Custom", which uses explicit start/end dates instead. */
  days: number | null;
  title: string;
  projection: string;
};

const RANGE_DESCRIPTORS: Record<RangeKey, RangeDescriptor> = {
  Week: {
    key: "Week",
    label: "Week",
    days: 7,
    title: "Last 7 Days",
    projection: "Recent weekly movement based on the latest available observations",
  },
  Month: {
    key: "Month",
    label: "Month",
    days: 30,
    title: "Last 30 Days",
    projection: "Recent monthly movement based on the available price history",
  },
  "3M": {
    key: "3M",
    label: "3M",
    days: 90,
    title: "Last 3 Months",
    projection: "Movement over the last quarter based on the available price history",
  },
  "6M": {
    key: "6M",
    label: "6M",
    days: 182,
    title: "Last 6 Months",
    projection: "Movement over the last half-year based on the available price history",
  },
  "1Y": {
    key: "1Y",
    label: "1Y",
    days: 365,
    title: "Last 12 Months",
    projection: "Movement over the last year based on the available price history",
  },
  Custom: {
    key: "Custom",
    label: "Custom",
    days: null,
    title: "Custom Range",
    projection: "Movement across the selected date range",
  },
};

const rangeOptions = Object.values(RANGE_DESCRIPTORS).map((descriptor) => descriptor.key);
const rangeLabels: Record<RangeKey, string> = Object.fromEntries(
  Object.values(RANGE_DESCRIPTORS).map((descriptor) => [descriptor.key, descriptor.label]),
) as Record<RangeKey, string>;

/**
 * Chart.js silently drops alternating axis labels once point count gets high
 * (found 2026-09-03 on the dashboard bar charts) and a 1-year window is ~12x
 * today's widest range, so the trend line is downsampled to at most this many
 * points rather than rendering one point per price record.
 */
const MAX_TREND_POINTS = 60;

interface WindowedRecord {
  price: number | null;
  dateAndTime: string | null;
}

function downsampleRecords(chronological: WindowedRecord[], maxPoints: number): WindowedRecord[] {
  if (chronological.length <= maxPoints) {
    return chronological;
  }

  const bucketSize = Math.ceil(chronological.length / maxPoints);
  const buckets: WindowedRecord[] = [];
  for (let start = 0; start < chronological.length; start += bucketSize) {
    const bucket = chronological.slice(start, start + bucketSize);
    const prices = bucket.map((record) => record.price).filter((price): price is number => price != null);
    buckets.push({
      price: prices.length > 0 ? prices.reduce((total, price) => total + price, 0) / prices.length : null,
      dateAndTime: bucket[bucket.length - 1]!.dateAndTime,
    });
  }
  return buckets;
}

function buildTrendPath(values: number[], width = 1000, height = 320, padding = 40) {
  if (values.length === 0) {
    return "";
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  return values
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - minValue) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function formatTrendLabel(date: string | null | undefined, index: number) {
  if (date) {
    const parsedDate = new Date(date);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
    }
  }

  return `P${index + 1}`;
}

/**
 * `records` must already be filtered to the real calendar window the caller wants
 * — this only shapes them for display, it doesn't decide the window. That split is
 * what makes "Last 7 Days" actually contain seven days of data instead of a fixed
 * point count mislabeled with a range name (B-32).
 */
function buildTrendInsight({
  activeRange,
  records,
  forecastConfidence,
}: {
  activeRange: RangeKey;
  records: WindowedRecord[];
  forecastConfidence: number | null;
}) {
  const descriptor = RANGE_DESCRIPTORS[activeRange];
  const chronological = downsampleRecords([...records].reverse(), MAX_TREND_POINTS);
  const values = chronological
    .map((record) => record.price)
    .filter((price): price is number => price != null);
  const latestPrice = records[0]?.price ?? null;
  const changeValue = values.length > 1 ? values[values.length - 1]! - values[0]! : null;
  const confidenceLabel = forecastConfidence == null
    ? "Low"
    : forecastConfidence >= 0.75
      ? "High"
      : forecastConfidence >= 0.5
        ? "Medium"
        : "Low";

  return {
    title: descriptor.title,
    price: formatCurrency(latestPrice),
    change: changeValue == null ? "No data" : formatChange(changeValue),
    confidence: confidenceLabel,
    projection: descriptor.projection,
    path: buildTrendPath(values),
    labels: chronological.map((record, index) => formatTrendLabel(record.dateAndTime, index)),
  };
}

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

function formatChange(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "No data";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

function filterRecordsWithinRealWindow<T extends { dateAndTime: string | null }>(records: T[], days: number): T[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return records.filter((record) => {
    if (!record.dateAndTime) return false;
    const recordDate = new Date(record.dateAndTime).getTime();
    return !Number.isNaN(recordDate) && recordDate >= cutoff;
  });
}

function filterRecordsWithinDateRange<T extends { dateAndTime: string | null }>(
  records: T[],
  startDate: string,
  endDate: string,
): T[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return [];

  const inclusiveEnd = end + 24 * 60 * 60 * 1000 - 1;
  return records.filter((record) => {
    if (!record.dateAndTime) return false;
    const recordDate = new Date(record.dateAndTime).getTime();
    return !Number.isNaN(recordDate) && recordDate >= start && recordDate <= inclusiveEnd;
  });
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultCustomStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

export default function PriceAnalysisPage() {
  const [activeRange, setActiveRange] = useState<RangeKey>("Week");
  const [customStartDate, setCustomStartDate] = useState<string>(getDefaultCustomStartDate());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayDateString());
  const [commodityOptions, setCommodityOptions] = useState<string[]>([]);
  const [commodityOptionsLoading, setCommodityOptionsLoading] = useState(true);
  const [commodities, setCommodities] = useState<PublicCommodityItem[]>([]);
  const [forecastPrice, setForecastPrice] = useState<number | null>(null);
  const [forecastConfidence, setForecastConfidence] = useState<number | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const selectedCommodityData = commodities.find(
    (commodity) => commodity.name === selectedCommodity,
  );
  const allRecords = selectedCommodityData?.priceRecords ?? [];
  const priceValues = allRecords
    .map((record) => (record.price != null ? Number(record.price) : null))
    .filter((price): price is number => price != null);
  const latestPrice = priceValues[0] ?? null;
  const previousPrice = priceValues[1] ?? null;
  const latestWindow = priceValues.slice(0, 3);
  const previousWindow = priceValues.slice(3, 6);
  const weeklyChange = latestWindow.length > 0 && previousWindow.length > 0
    ? average(latestWindow) != null && average(previousWindow) != null
      ? average(latestWindow)! - average(previousWindow)!
      : null
    : null;

  const thirtyDayValues = filterRecordsWithinRealWindow(allRecords, 30)
    .map((record) => (record.price != null ? Number(record.price) : null))
    .filter((price): price is number => price != null);
  const trendChange = thirtyDayValues.length > 1
    ? thirtyDayValues[0]! - thirtyDayValues[thirtyDayValues.length - 1]!
    : null;

  const rangeDescriptor = RANGE_DESCRIPTORS[activeRange];
  const recordsInRange = rangeDescriptor.days != null
    ? filterRecordsWithinRealWindow(allRecords, rangeDescriptor.days)
    : filterRecordsWithinDateRange(allRecords, customStartDate, customEndDate);
  const windowedRecords = recordsInRange.map((record) => ({
    price: record.price != null ? Number(record.price) : null,
    dateAndTime: record.dateAndTime,
  }));
  const activeInsight = buildTrendInsight({
    activeRange,
    records: windowedRecords,
    forecastConfidence,
  });

  const chronologicalWindow = [...windowedRecords].reverse();
  const windowValues = chronologicalWindow
    .map((record) => record.price)
    .filter((price): price is number => price != null);
  const windowMin = windowValues.length > 0 ? Math.min(...windowValues) : 0;
  const windowMax = windowValues.length > 0 ? Math.max(...windowValues) : 1;
  const windowRange = windowMax - windowMin || 1;
  const trendPoints = chronologicalWindow.map((record, index) => {
    const price = record.price;
    const x = 40 + (chronologicalWindow.length > 1 ? (index / (chronologicalWindow.length - 1)) * 920 : 0);
    const y = price != null ? 280 - ((price - windowMin) / windowRange) * 240 : 160;

    return {
      date: record.dateAndTime,
      price,
      label: formatTrendLabel(record.dateAndTime, index),
      x,
      y: Number.isNaN(y) ? 160 : y,
    };
  });

  const dailyChanges = [
    {
      label: "Today",
      value: formatChange(latestPrice != null && previousPrice != null ? latestPrice - previousPrice : null),
      note: latestPrice != null && previousPrice != null
        ? `From ${formatCurrency(previousPrice)} to ${formatCurrency(latestPrice)}`
        : "Not enough recent price records",
    },
    {
      label: "This week",
      value: formatChange(weeklyChange),
      note: weeklyChange != null
        ? "Compared with the previous set of recent observations"
        : "Not enough recent price records",
    },
    {
      label: "30-day trend",
      value: formatChange(trendChange),
      note: trendChange != null
        ? "Across the available recent price history"
        : "Not enough recent price records",
    },
  ];

  const summaryCards = [
    {
      title: "Current price",
      value: formatCurrency(selectedCommodityData?.currentPrice),
      detail: selectedCommodityData?.lastUpdatedAt
        ? `Updated ${new Date(selectedCommodityData.lastUpdatedAt).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
          })}`
        : "No recent price data",
      explanation:
        "The most recent price a monitoring officer recorded for this item in a store.",
      icon: MdMonetizationOn,
      accent: "text-primary",
    },
    {
      title: "Latest SRP",
      value: formatCurrency(selectedCommodityData?.srpPrice),
      detail: selectedCommodityData?.complianceStatus
        ? `Status: ${selectedCommodityData.complianceStatus}`
        : "No SRP data available",
      explanation:
        "The Suggested Retail Price set by DTI — the reference this item's price is checked against.",
      icon: MdVerified,
      accent: "text-success",
    },
    {
      title: "Forecasted next week",
      value: formatCurrency(forecastPrice),
      detail: isForecastLoading
        ? "Generating forecast..."
        : forecastPrice != null
          ? "Projected from recent trend"
          : "No forecast data available",
      explanation:
        "An estimate of next week's price, projected from this item's recent price history.",
      icon: MdTrendingUp,
      accent: "text-error",
    },
  ];
  
  useEffect(() => {
    let isMounted = true;

    const loadCommodities = async () => {
      try {
        setCommodityOptionsLoading(true);
        const fetchedCommodities = await getPublicCommodities();
        const fetchedCommodityNames = Array.from(
          new Set(
            fetchedCommodities
              .map((commodity) => commodity.name?.trim())
              .filter((name): name is string => Boolean(name)),
          ),
        );

        if (!isMounted) return;

        setCommodities(fetchedCommodities);
        setCommodityOptions(fetchedCommodityNames);
        setSelectedCommodity((current) => {
          if (current && fetchedCommodityNames.includes(current)) {
            return current;
          }
          return fetchedCommodityNames[0] ?? "";
        });
      } catch (error) {
        console.error("Unable to load commodities", error);
      } finally {
        if (isMounted) setCommodityOptionsLoading(false);
      }
    };

    void loadCommodities();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadForecast = async () => {
      const commodityId = selectedCommodityData?.id;

      if (!commodityId) {
        if (isMounted) {
          setForecastPrice(null);
          setForecastConfidence(null);
          setIsForecastLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsForecastLoading(true);
      }

      try {
        const forecasts = await getPublicForecastByCommodityId(commodityId);

        if (!isMounted) return;

        const day7Forecast = forecasts[6];
        if (isMounted) {
          setForecastPrice(day7Forecast?.predictedPrice != null ? Number(day7Forecast.predictedPrice) : null);
          setForecastConfidence(day7Forecast?.confidence != null ? Number(day7Forecast.confidence) : null);
          setIsForecastLoading(false);
        }
      } catch (error) {
        console.error("Unable to load forecast", error);
        if (isMounted) {
          setForecastPrice(null);
          setForecastConfidence(null);
          setIsForecastLoading(false);
        }
      }
    };

    void loadForecast();

    return () => {
      isMounted = false;
    };
  }, [selectedCommodityData?.id]);

  return (
    <PageShell className="bg-surface-container-low">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-container-margin-mobile py-8 md:px-container-margin-desktop md:py-10">
        <PriceAnalysisHeader
          selectedCommodity={selectedCommodity}
          commodityOptions={commodityOptions}
          commodityOptionsLoading={commodityOptionsLoading}
          onSelectCommodity={setSelectedCommodity}
        />

        <PriceAnalysisSummaryCards cards={summaryCards} />

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
          <PriceTrendPanel
            activeInsight={activeInsight}
            activeRange={activeRange}
            rangeOptions={rangeOptions}
            rangeLabels={rangeLabels}
            points={trendPoints}
            selectedPointIndex={selectedPointIndex}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onRangeChange={(range) => {
              setActiveRange(range);
              setSelectedPointIndex(null);
            }}
            onCustomStartDateChange={(value) => {
              setCustomStartDate(value);
              setSelectedPointIndex(null);
            }}
            onCustomEndDateChange={(value) => {
              setCustomEndDate(value);
              setSelectedPointIndex(null);
            }}
            onPointSelect={setSelectedPointIndex}
          />

          <ForecastSummaryPanel
            activeInsight={activeInsight}
            currentPrice={selectedCommodityData?.currentPrice ?? null}
            projectedPrice={forecastPrice}
            confidence={forecastConfidence}
            onOpenDetail={() => setShowDetailModal(true)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <DailyChangesPanel changes={dailyChanges} />
          <ForecastMethodPanel />
        </div>
      </section>

      {showDetailModal ? (
        <ForecastDetailModal
          selectedCommodity={selectedCommodity}
          currentPrice={selectedCommodityData?.currentPrice ?? null}
          projectedPrice={forecastPrice}
          confidence={forecastConfidence}
          srpPrice={selectedCommodityData?.srpPrice ?? null}
          trendPoints={trendPoints}
          rangeTitle={activeInsight.title}
          onClose={() => setShowDetailModal(false)}
        />
      ) : null}
    </PageShell>
  );
}
