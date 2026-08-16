"use client";

import { useEffect, useState } from "react";
import { MdVerified } from "react-icons/md";
import { getPublicCommodities, getPublicStats } from "@/features/commodity";

interface ProvenanceSummary {
  storeCount: number;
  municipalityCount: number;
  lastUpdatedAt: string | null;
}

const initialSummary: ProvenanceSummary = {
  storeCount: 0,
  municipalityCount: 0,
  lastUpdatedAt: null,
};

function formatLastUpdated(value: string | null) {
  if (!value) {
    return "recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

interface DataProvenanceStripProps {
  className?: string;
}

export default function DataProvenanceStrip({ className = "" }: DataProvenanceStripProps) {
  const [summary, setSummary] = useState<ProvenanceSummary>(initialSummary);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const [commodities, stats] = await Promise.all([getPublicCommodities(), getPublicStats()]);

        if (!isMounted) {
          return;
        }

        const municipalities = new Set(
          commodities
            .map((commodity) => commodity.storeLocation?.trim())
            .filter((value): value is string => Boolean(value)),
        );

        const latestUpdate = commodities.reduce<string | null>((latest, commodity) => {
          if (!commodity.lastUpdatedAt) {
            return latest;
          }
          if (!latest || new Date(commodity.lastUpdatedAt) > new Date(latest)) {
            return commodity.lastUpdatedAt;
          }
          return latest;
        }, null);

        setSummary({
          storeCount: stats.monitoredStoreCount,
          municipalityCount: municipalities.size,
          lastUpdatedAt: latestUpdate,
        });
      } catch {
        if (isMounted) {
          setSummary(initialSummary);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant sm:text-sm ${className}`.trim()}
    >
      <MdVerified className="shrink-0 text-primary" size={18} />
      {isLoading ? (
        <span>Loading data provenance…</span>
      ) : (
        <span>
          Prices collected by DTI field officers · last updated {formatLastUpdated(summary.lastUpdatedAt)} ·{" "}
          {summary.storeCount} store{summary.storeCount === 1 ? "" : "s"} across {summary.municipalityCount}{" "}
          municipalit{summary.municipalityCount === 1 ? "y" : "ies"}
        </span>
      )}
    </div>
  );
}
