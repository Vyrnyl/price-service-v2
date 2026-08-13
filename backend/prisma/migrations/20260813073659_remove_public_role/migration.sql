-- Remove PUBLIC role: PresyoSerbisyo has no PUBLIC-role accounts (D-7);
-- public access is unauthenticated via /api/public/*.

-- Drop the default before the column is repointed to the new type.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- Postgres cannot drop a value from an enum type directly, so the type is
-- recreated without it and the column is repointed.
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'OFFICER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
