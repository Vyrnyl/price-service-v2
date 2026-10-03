// The SRP history pop-up (chart, change history and, for account roles, the
// SRP outlook) is switched off for now at the user's request — 2026-10-03.
// Every entry point reads this flag: the public Commodity List's row click,
// chevron and hint, and the admin/officer Commodities table's row click and
// history button. The pop-up, its hooks and endpoints are left in place, so
// setting this back to `true` restores the feature unchanged.
export const SRP_HISTORY_ENABLED = false;
