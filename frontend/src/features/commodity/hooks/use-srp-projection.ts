import { useEffect, useState } from "react";
import type { SrpProjection, SrpProjectionState } from "@/shared/types/srp-history.types";
import { getSrpProjection } from "../services/commodity.api";

type SrpProjectionResult = {
  commodityId: string;
  projection: SrpProjection | null;
  error: string | null;
};

const LOAD_ERROR = "Unable to load the SRP outlook. Please try again.";

/**
 * Loads one commodity's SRP outlook for the admin/officer pop-up. Kept apart
 * from `useSrpHistory` because the endpoint is account-only — the public
 * Commodity List never calls it. Pass `null` while the pop-up is closed.
 *
 * Same shape as `useSrpHistory`: loading is derived, and a late response for a
 * commodity the reader has moved away from is discarded.
 */
export function useSrpProjection(commodityId: string | null): SrpProjectionState {
  const [result, setResult] = useState<SrpProjectionResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!commodityId) {
      return;
    }

    let cancelled = false;

    getSrpProjection(commodityId)
      .then((data) => {
        if (!cancelled) {
          setResult({ commodityId, projection: data.projection, error: null });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ commodityId, projection: null, error: LOAD_ERROR });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [commodityId, attempt]);

  const current = result && result.commodityId === commodityId ? result : null;

  return {
    projection: current?.projection ?? null,
    isLoading: commodityId !== null && current === null,
    error: current?.error ?? null,
    onRetry: () => {
      setResult(null);
      setAttempt((value) => value + 1);
    },
  };
}
