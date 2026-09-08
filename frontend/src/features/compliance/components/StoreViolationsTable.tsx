"use client";

import Badge from "@/shared/components/Badge";
import { SkeletonTableRows } from "@/shared/components/Skeleton";
import type { StoreViolationPoint } from "@/shared/types/dashboard.types";

type StoreViolationsTableProps = {
  points: StoreViolationPoint[];
  isLoading?: boolean;
  error?: string | null;
};

function rateVariant(rate: number): "success" | "warning" | "error" {
  if (rate === 0) return "success";
  if (rate < 25) return "warning";
  return "error";
}

export function StoreViolationsTable({ points, isLoading, error }: StoreViolationsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow">
      {error ? (
        <p className="flex h-40 items-center justify-center px-6 text-body-sm text-error">{error}</p>
      ) : isLoading ? (
        <SkeletonTableRows rows={5} />
      ) : points.length === 0 ? (
        <p className="flex h-40 items-center justify-center px-6 text-center text-body-sm text-on-surface-variant">
          No price records with a store attached in the last 30 days.
        </p>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    <th className="px-6 py-4 text-label-caps uppercase text-outline">Store</th>
                    <th className="px-6 py-4 text-right text-label-caps uppercase text-outline">Records</th>
                    <th className="px-6 py-4 text-right text-label-caps uppercase text-outline">Above SRP</th>
                    <th className="px-6 py-4 text-right text-label-caps uppercase text-outline">Violation Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {points.map((point) => (
                    <tr key={point.storeId} className="transition-colors">
                      <td className="px-6 py-4 text-body-sm font-semibold text-on-surface">{point.storeName}</td>
                      <td className="px-6 py-4 text-right text-body-sm text-on-surface-variant">
                        {point.totalRecords}
                      </td>
                      <td className="px-6 py-4 text-right text-body-sm text-on-surface-variant">
                        {point.violationCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={rateVariant(point.violationRate)}>{point.violationRate.toFixed(1)}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {points.map((point) => (
              <div key={point.storeId} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-body-sm font-semibold text-on-surface">{point.storeName}</p>
                  <Badge variant={rateVariant(point.violationRate)}>{point.violationRate.toFixed(1)}%</Badge>
                </div>
                <p className="mt-2 text-body-xs text-outline">
                  {point.violationCount} of {point.totalRecords} records above SRP
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant bg-surface-container-low px-6 py-4">
            <p className="text-body-sm text-on-surface-variant">
              {points.length} store{points.length === 1 ? "" : "s"} with recorded prices in the last 30 days
            </p>
          </div>
        </>
      )}
    </div>
  );
}
