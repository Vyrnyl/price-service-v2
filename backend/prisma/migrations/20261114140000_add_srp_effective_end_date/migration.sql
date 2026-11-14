-- 2026-11-14: an SRP can be entered with a date range (client revision).
-- "effectiveDate" stays the start and still decides which SRP is in force
-- (the newest one on or before a date); "effectiveEndDate" is a label only —
-- nothing changes when it passes. Nullable and additive: every existing SRP
-- stays NULL and keeps showing its single effective date.
-- Undo: ALTER TABLE "SRP" DROP COLUMN "effectiveEndDate";
ALTER TABLE "SRP" ADD COLUMN "effectiveEndDate" TIMESTAMP(3);
