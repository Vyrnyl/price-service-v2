-- 2026-11-14: a price record can cover a date range (client revision, update.txt).
-- "dateAndTime" stays the start (it still drives status, charts and forecasts);
-- "periodEnd" is the last day of the range. Nullable and additive: every
-- existing row stays NULL and keeps showing its single date and time.
-- Undo: ALTER TABLE "PriceRecord" DROP COLUMN "periodEnd";
ALTER TABLE "PriceRecord" ADD COLUMN "periodEnd" TIMESTAMP(3);
