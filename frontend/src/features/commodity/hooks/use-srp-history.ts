import { useEffect, useState } from "react";
import type { SrpHistoryEntry } from "@/shared/types/srp-history.types";
import { getPublicSrpHistory } from "../services/commodity.api";

type SrpHistoryResult = {
  commodityId: string;
  entries: SrpHistoryEntry[];
  error: string | null;
};

const LOAD_ERROR = "Unable to load the SRP history. Please try again.";

/**
 * Loads one commodity's SRP history for the pop-up. Shared by the public
 * Commodity List and the admin/officer Commodities pages so all three behave
 * the same. Pass `null` while the pop-up is closed.
 *
 * Loading is derived (no result yet for the requested id) rather than set
 * inside the effect, and a late response for a commodity the reader has since
 * moved away from is discarded instead of overwriting the one on screen.
 */
export function useSrpHistory(commodityId: string | null) {
  const [result, setResult] = useState<SrpHistoryResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!commodityId) {
      return;
    }

    let cancelled = false;

    getPublicSrpHistory(commodityId)
      .then((data) => {
        if (!cancelled) {
          setResult({ commodityId, entries: data.entries, error: null });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ commodityId, entries: [], error: LOAD_ERROR });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [commodityId, attempt]);

  const current = result && result.commodityId === commodityId ? result : null;

  return {
    entries: current?.entries ?? [],
    isLoading: commodityId !== null && current === null,
    error: current?.error ?? null,
    retry: () => {
      setResult(null);
      setAttempt((value) => value + 1);
    },
  };
}
