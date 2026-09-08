-- Phase 7.6: Commodity.category (free text) -> Category (real reference table).
--
-- Live Neon data queried 2026-09-07: 135 commodities, 19 distinct raw category
-- strings, including a near-duplicate pair ("Bottled Water-Distilled" vs.
-- "Bottled Water Distilled", no hyphen) and a stray lowercase "drinks". Settled
-- backfill plan: merge the duplicate pair into the hyphenated spelling, and
-- title-case "drinks" -> "Drinks" -- yields 18 clean Category rows. Every
-- existing commodity must resolve to one of them before the FK is added, or
-- this migration fails loudly on live data rather than silently dropping rows.

-- 1. Create the reference table.
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- 2. Backfill one Category row per normalized distinct value, applying the
--    settled merge/title-case mapping so duplicates collapse to a single row.
INSERT INTO "Category" ("id", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid(),
       normalized.name,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT
        CASE
            WHEN "category" = 'Bottled Water Distilled' THEN 'Bottled Water-Distilled'
            WHEN "category" = 'drinks' THEN 'Drinks'
            ELSE "category"
        END AS name
    FROM "Commodity"
) AS normalized;

-- 3. Add the new FK column, nullable for now so existing rows aren't dropped
--    mid-migration.
ALTER TABLE "Commodity" ADD COLUMN "categoryId" UUID;

-- 4. Populate it from the same normalization used to seed Category.
UPDATE "Commodity" c
SET "categoryId" = cat."id"
FROM "Category" cat
WHERE cat."name" = CASE
    WHEN c."category" = 'Bottled Water Distilled' THEN 'Bottled Water-Distilled'
    WHEN c."category" = 'drinks' THEN 'Drinks'
    ELSE c."category"
END;

-- 5. Every commodity must now have a categoryId. Fail loudly instead of
--    silently constraining a partially-populated column.
DO $$
DECLARE
    unmatched INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmatched FROM "Commodity" WHERE "categoryId" IS NULL;
    IF unmatched > 0 THEN
        RAISE EXCEPTION 'Category backfill left % commodity row(s) unmatched', unmatched;
    END IF;
END $$;

-- 6. Drop the old free-text column and constrain the new one.
ALTER TABLE "Commodity" DROP COLUMN "category";
ALTER TABLE "Commodity" ALTER COLUMN "categoryId" SET NOT NULL;

CREATE INDEX "Commodity_categoryId_idx" ON "Commodity"("categoryId");

ALTER TABLE "Commodity" ADD CONSTRAINT "Commodity_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
