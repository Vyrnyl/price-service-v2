interface DatedSrpRow {
  effectiveDate: Date;
  createdAt: Date;
}

/**
 * Two SRP rows sharing an effective date are an officer correcting that day's
 * SRP, not two changes. Only the last one saved counts — the same tie-break
 * (`createdAt` desc) the commodity list uses to pick the current SRP — so
 * nothing downstream sees a zero-length "change" to a value never in force.
 *
 * Returns one row per effective date, oldest first.
 */
export function latestPerEffectiveDate<T extends DatedSrpRow>(rows: T[]): T[] {
  const chronological = [...rows].sort(
    (a, b) =>
      a.effectiveDate.getTime() - b.effectiveDate.getTime() || a.createdAt.getTime() - b.createdAt.getTime(),
  );

  const latestPerDate = new Map<number, T>();
  for (const row of chronological) {
    latestPerDate.set(row.effectiveDate.getTime(), row);
  }

  return [...latestPerDate.values()];
}
