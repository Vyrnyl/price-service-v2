"use client";

import { useEffect, useState } from "react";
import PageShell from "@/shared/components/PageShell";
import { StoreViolationsChart } from "@/shared/components/charts/StoreViolationsChart";
import { StoreViolationsTable } from "../components/StoreViolationsTable";
import { fetchStoreViolations } from "@/shared/services/dashboard.service";
import type { StoreViolationPoint } from "@/shared/types/dashboard.types";

export default function StoreComplianceOverviewPage() {
  const [points, setPoints] = useState<StoreViolationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchStoreViolations();
        if (isMounted) {
          setPoints(data);
          setError(null);
        }
      } catch (loadError) {
        console.error("Failed to load store violations", loadError);
        if (isMounted) {
          setError("Unable to load store compliance data right now.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-8 sm:py-10 md:px-container-margin-desktop md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="font-sans text-h1-desktop text-on-surface mobile:font-sans mobile:text-h1-mobile">
              Store Compliance
            </h1>
            <p className="mt-1 text-body-lg text-on-surface-variant">
              Which stores have priced commodities above their Suggested Retail Price over the last 30 days.
            </p>
          </div>

          <StoreViolationsChart points={points} isLoading={isLoading} error={error} />
          <StoreViolationsTable points={points} isLoading={isLoading} error={error} />
        </div>
      </section>
    </PageShell>
  );
}
