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

const rangeOptions = ["Week", "Month"] as const;

type RangeKey = (typeof rangeOptions)[number];

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

interface WindowedRecord {
  price: number | null;
  dateAndTime: string | null;
}

/**
 * `records` must already be filtered to the real calendar window the caller wants
 * (last 7 or 30 days) — this only shapes them for display, it doesn't decide the window.
 * That split is what makes "Last 7 Days" actually contain seven days of data instead of
 * a fixed point count mislabeled with a range name (B-32).
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
  const chronological = [...records].reverse();
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
    title: activeRange === "Week" ? "Last 7 Days" : "Last 30 Days",
    price: formatCurrency(latestPrice),
    change: changeValue == null ? "No data" : formatChange(changeValue),
    confidence: confidenceLabel,
    projection: activeRange === "Week"
      ? "Recent weekly movement based on the latest available observations"
      : "Recent monthly movement based on the available price history",
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

export default function PriceAnalysisPage() {
  const [activeRange, setActiveRange] = useState<RangeKey>("Week");
  const [commodityOptions, setCommodityOptions] = useState<string[]>([]);
  const [commodities, setCommodities] = useState<PublicCommodityItem[]>([]);
  const [forecastPrice, setForecastPrice] = useState<number | null>(null);
  const [forecastConfidence, setForecastConfidence] = useState<number | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [isCommodityOpen, setIsCommodityOpen] = useState(false);
  const [commoditySearch, setCommoditySearch] = useState("");
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

  const windowedRecords = filterRecordsWithinRealWindow(allRecords, activeRange === "Week" ? 7 : 30).map((record) => ({
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
      icon: MdMonetizationOn,
      accent: "text-primary",
    },
    {
      title: "Latest SRP",
      value: formatCurrency(selectedCommodityData?.srpPrice),
      detail: selectedCommodityData?.complianceStatus
        ? `Status: ${selectedCommodityData.complianceStatus}`
        : "No SRP data available",
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
      icon: MdTrendingUp,
      accent: "text-error",
    },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadCommodities = async () => {
      try {
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

  const filteredCommodities = commodityOptions.filter((option) =>
    option.toLowerCase().includes(commoditySearch.trim().toLowerCase()),
  );

  return (
    <PageShell className="bg-surface-container-low">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-container-margin-mobile py-8 md:px-container-margin-desktop md:py-10">
        <PriceAnalysisHeader
          selectedCommodity={selectedCommodity}
          isCommodityOpen={isCommodityOpen}
          commoditySearch={commoditySearch}
          filteredCommodities={filteredCommodities}
          onToggleCommodity={() => {
            setIsCommodityOpen((value) => !value);
            setCommoditySearch("");
          }}
          onCommoditySearchChange={setCommoditySearch}
          onSelectCommodity={(option) => {
            setSelectedCommodity(option);
            setIsCommodityOpen(false);
            setCommoditySearch("");
          }}
        />

        <PriceAnalysisSummaryCards cards={summaryCards} />

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
          <PriceTrendPanel
            activeInsight={activeInsight}
            activeRange={activeRange}
            rangeOptions={rangeOptions}
            points={trendPoints}
            selectedPointIndex={selectedPointIndex}
            onRangeChange={(range) => {
              setActiveRange(range);
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
          onClose={() => setShowDetailModal(false)}
        />
      ) : null}
    </PageShell>
  );
}
