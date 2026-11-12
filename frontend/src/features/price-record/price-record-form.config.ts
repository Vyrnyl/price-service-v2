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
