const TIME_ZONE = "Asia/Manila";

// Phase 7.8: an SRP effective date may be any date in the past (SRP rows are
// historical records, and 6.6 established that an "update" always writes a
// new historical row rather than editing in place — a hard no-past floor
// would block legitimate backdated corrections) but no more than this many
// days ahead. Mirrors backend/src/shared/utils/srp-effective-date.ts — keep
// both in sync.
export const SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD = 7;

// Returns today's date string (YYYY-MM-DD) in the Asia/Manila calendar day,
// independent of the browser's own local timezone.
export function getManilaDateString(reference: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(reference);
}

// The latest effective date allowed, as a YYYY-MM-DD string in the
// Asia/Manila calendar day — also usable as an <input type="date"> max.
export function getMaxSrpEffectiveDateString(reference: Date = new Date()): string {
  const todayManila = getManilaDateString(reference);
  const [year, month, day] = todayManila.split("-").map(Number);
  const max = new Date(Date.UTC(year!, month! - 1, day! + SRP_EFFECTIVE_DATE_MAX_DAYS_AHEAD));
  return max.toISOString().slice(0, 10);
}

export function isSrpEffectiveDateWithinWindow(dateString: string, reference: Date = new Date()): boolean {
  if (!dateString) return true;
  return dateString <= getMaxSrpEffectiveDateString(reference);
}
