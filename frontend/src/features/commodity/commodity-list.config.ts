// Client-requested revision to the officer Commodities page — 2026-11-12.
// Both flags exist so the revision can be rolled back without a code change
// beyond flipping them; nothing here touches the database or the SRP model.
//
// COMMODITY_CATEGORY_FILTER_ENABLED — a category dropdown in the Commodities
//   table's filter panel (admin and officer). `false` removes the dropdown.
//
// INLINE_SRP_EDIT_ENABLED — the officer edits SRPs straight in the table:
//   "ADD NEW SRP" (labelled "Edit SRP", then "Add SRP", until 2026-11-14) turns every SRP cell on
//   the page into an input, one Effective Date at the top right applies to all of them, and Save records a new SRP
//   for each row whose price changed (SRPs stay historical — nothing is
//   overwritten). While it is on, the Edit Commodity dialog no longer shows the
//   SRP price and effective-date fields. `false` restores the old behaviour:
//   no inline editor, and the SRP fields come back in the Edit dialog.
//
// NEW_COMMODITY_ENABLED — the "New Commodity" button in the page header. The
//   client says the catalogue is fixed, so it is hidden for now. Only the
//   button is gated: the Add form (AddCommodityDialog in create mode), the
//   POST /commodities route and its RBAC are untouched, so `true` restores it.
export const COMMODITY_CATEGORY_FILTER_ENABLED = true;
export const INLINE_SRP_EDIT_ENABLED = true;
export const NEW_COMMODITY_ENABLED = false;

// SRP_DATE_RANGE_ENABLED — 2026-11-14 client revision. "ADD NEW SRP" takes an
//   Effective Date range: From (required, the date the SRP takes effect, as
//   before) and an optional To. The Effective Date column and the SRP history
//   pop-up show "Jan 1 – Dec 31, 2025" for an SRP with an end date. The end is
//   a label only: an SRP stays in force until a newer one takes effect, so
//   status, compliance and the outlook ignore it. `false` brings back the
//   single Effective Date and saves no end date; SRPs that already have one
//   keep showing their range.
export const SRP_DATE_RANGE_ENABLED = true;

// SRP_EDIT_BROWSE_ENABLED — 2026-11-14 client revision. While "ADD NEW SRP" is
//   on, the search, category and status filters and the pagination stay usable,
//   and the prices typed on one page or filter are kept when the officer moves
//   to another. Save records every typed price, wherever it was typed, under the
//   one Effective Date range. `false` locks the filters and pagination again
//   while editing (the earlier behaviour); typed prices are still kept by
//   commodity, so nothing else changes.
export const SRP_EDIT_BROWSE_ENABLED = true;
