// Client-requested revision to the officer Price Records page — 2026-11-12,
// the companion to commodity-list.config.ts. Built so it can be rolled back.
//
// PRICE_RECORD_BULK_ENTRY_ENABLED — "New Entry" opens the bulk Add form: one
//   store and one date & time, a category filter, and a scrollable list of
//   commodities with a price input each; Save records one price record per
//   commodity that has a price. `false` brings back the single-record Add form
//   (store, commodity, date & time, price). Editing an existing record always
//   uses the single-record form. No schema or API change is involved.
export const PRICE_RECORD_BULK_ENTRY_ENABLED = true;

// PRICE_RECORD_DATE_RANGE_ENABLED — 2026-11-14 client revision (update.txt).
//   The Add forms (bulk and single) and the Edit form ask for a date range
//   (From – To, e.g. Jan 5 – Feb 20) instead of one date & time. The start is
//   saved as `dateAndTime` and the end as `periodEnd`, each that date at 00:00
//   UTC — the convention SRP effective dates use (see utils/date-range.ts).
//   Nothing happens when a range ends — it is a label, not a schedule; status,
//   charts and forecasts keep using `dateAndTime`. `false` restores the single
//   Date & Time field and saves no `periodEnd`. Records that already have a
//   range keep showing it in the list either way, and editing one with the
//   flag off leaves its `periodEnd` untouched.
export const PRICE_RECORD_DATE_RANGE_ENABLED = true;
