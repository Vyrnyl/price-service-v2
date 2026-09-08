-- Phase 7.7: enforce a case-insensitive, global unique constraint on
-- Commodity.name.
--
-- Live Neon data queried 2026-09-07: 137 commodities, 2 real exact-duplicate
-- name pairs, 0 case-only variants. Both duplicate pairs carry genuinely
-- independent price history (real PriceRecord rows and forecasts, different
-- SRPs) -- not junk to merge. Settled with the user: rename the newer row of
-- each pair to disambiguate, keeping both rows' history untouched, rather
-- than merging and discarding data.

-- 1. Disambiguate the two known live duplicate pairs by renaming the newer
--    row of each (by id, so this is precise rather than a blind "rename any
--    row past the first" rule that could pick the wrong one on replay).
UPDATE "Commodity"
SET "name" = "name" || ' (2)'
WHERE "id" = 'a048ebfc-fca1-4e96-8c6b-6d345ff0d1ae'; -- "ABSOLUTE PURE Distilled Water (1.5L)", created 2026-09-03 (srp 350)

UPDATE "Commodity"
SET "name" = "name" || ' (2)'
WHERE "id" = 'c126cedc-aeba-40ce-ad25-f900cf836d64'; -- "5-STAR Esperma (White) 25pcs/pack", created 2026-09-02, category Material (srp 142/23)

-- 2. Guard: any remaining case-insensitive duplicate would make the index
--    below fail anyway, but fail with a clear message rather than Postgres's
--    generic one, in case new data landed between the query above and this
--    migration running.
DO $$
DECLARE
    remaining INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining
    FROM (
        SELECT lower(trim("name")) AS normalized
        FROM "Commodity"
        GROUP BY lower(trim("name"))
        HAVING COUNT(*) > 1
    ) AS dupes;
    IF remaining > 0 THEN
        RAISE EXCEPTION 'Commodity.name has % remaining case-insensitive duplicate(s) after the known-pair rename', remaining;
    END IF;
END $$;

-- 3. Case-insensitive, global unique index, trim-aware to match the app's
--    own `z.string().trim()` normalization. Prisma's schema DSL has no
--    case-insensitive @unique, so this is enforced via a functional index
--    on lower(trim(name)) rather than a schema-level attribute. This is a
--    backstop, not the primary enforcement: commodity.service.ts checks
--    case-insensitively via commodityRepository.findByNameCaseInsensitive
--    before every create/update and throws a clean 409 with the exact
--    colliding name, since Prisma 7's driver-adapter layer does not
--    reliably translate every raw Postgres unique-violation into a
--    PrismaClientKnownRequestError/P2002 for a functional index the way it
--    does for a schema-declared @@unique (the same class of gap B-53 found
--    for a RESTRICT foreign-key violation).
CREATE UNIQUE INDEX "Commodity_name_lower_key" ON "Commodity" (lower(trim("name")));
