-- 2026-11-12: let a category store the icon chosen on the Category form.
-- Nullable and additive: every existing row stays NULL, which the app reads
-- as "Automatic" (icon matched from the category name), so nothing visible
-- changes until an officer picks an icon. Undo: ALTER TABLE "Category" DROP COLUMN "iconKey";
ALTER TABLE "Category" ADD COLUMN "iconKey" TEXT;
