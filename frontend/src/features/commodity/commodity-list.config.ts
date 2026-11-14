// Client-requested revision to the officer Commodities page — 2026-11-12.
// Both flags exist so the revision can be rolled back without a code change
// beyond flipping them; nothing here touches the database or the SRP model.
//
// COMMODITY_CATEGORY_FILTER_ENABLED — a category dropdown in the Commodities
//   table's filter panel (admin and officer). `false` removes the dropdown.
//
// INLINE_SRP_EDIT_ENABLED — the officer edits SRPs straight in the table:
//   "Add SRP" (labelled "Edit SRP" until 2026-11-14) turns every SRP cell on
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
