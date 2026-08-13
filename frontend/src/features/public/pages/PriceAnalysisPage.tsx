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

function buildTrendInsight({
  activeRange,
  values,
  latestPrice,
  forecastConfidence,
}: {
  activeRange: RangeKey;
  values: number[];
  latestPrice: number | null;
  forecastConfidence: number | null;
}) {
  const orderedValues = [...values].reverse();
  const pointCount = activeRange === "Week" ? 6 : 8;
  const visibleValues = orderedValues.slice(0, pointCount);
  const changeValue = visibleValues.length > 1 ? visibleValues[visibleValues.length - 1] - visibleValues[0] : null;
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
    path: buildTrendPath(visibleValues),
    labels: visibleValues.map((_, index) => formatTrendLabel(null, index)),
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
  const priceValues = (selectedCommodityData?.priceRecords ?? [])
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
  const trendChange = priceValues.length > 1
    ? latestPrice != null
      ? latestPrice - (priceValues[priceValues.length - 1] ?? latestPrice)
      : null
    : null;
  const activeInsight = buildTrendInsight({
    activeRange,
    values: priceValues,
    latestPrice,
    forecastConfidence,
  });
  const trendPoints = (selectedCommodityData?.priceRecords ?? [])
    .map((record, index) => {
      const price = record.price != null ? Number(record.price) : null;
      const pointCount = activeRange === "Week" ? 6 : 8;
      const safeIndex = Math.max(0, index);
      const pointValues = (selectedCommodityData?.priceRecords ?? [])
        .map((entry) => (entry.price != null ? Number(entry.price) : null))
        .filter((entry): entry is number => entry != null)
        .slice(0, pointCount)
        .reverse();
      const minValue = pointValues.length > 0 ? Math.min(...pointValues) : 0;
      const maxValue = pointValues.length > 0 ? Math.max(...pointValues) : 1;
      const range = maxValue - minValue || 1;
      const y = 280 - ((price != null ? price : minValue) - minValue) / range * 240;
      const x = 40 + (safeIndex / Math.max(pointCount - 1, 1)) * 920;

      return {
        date: record.dateAndTime,
        price,
        label: formatTrendLabel(record.dateAndTime, index),
        x,
        y: Number.isNaN(y) ? 160 : y,
      };
    })
    .slice(0, activeRange === "Week" ? 6 : 8)
    .reverse();

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
    <main className="min-h-screen bg-surface-container-low lg:ml-72">
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
    </main>
  );
}
