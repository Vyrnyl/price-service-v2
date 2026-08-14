-- AlterTable
ALTER TABLE "Commodity" ADD COLUMN     "updatedAt" TIMESTAMP(3);
UPDATE "Commodity" SET "updatedAt" = "createdAt";
ALTER TABLE "Commodity" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Forecast" ADD COLUMN     "updatedAt" TIMESTAMP(3);
UPDATE "Forecast" SET "updatedAt" = "createdAt";
ALTER TABLE "Forecast" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "PriceRecord" ADD COLUMN     "updatedAt" TIMESTAMP(3);
UPDATE "PriceRecord" SET "updatedAt" = "createdAt";
ALTER TABLE "PriceRecord" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "updatedAt" TIMESTAMP(3);
UPDATE "Report" SET "updatedAt" = "createdAt";
ALTER TABLE "Report" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "SRP" ADD COLUMN     "updatedAt" TIMESTAMP(3);
UPDATE "SRP" SET "updatedAt" = "createdAt";
ALTER TABLE "SRP" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "updatedAt" TIMESTAMP(3);
UPDATE "Store" SET "updatedAt" = "createdAt";
ALTER TABLE "Store" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3);
UPDATE "User" SET "updatedAt" = "createdAt";
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;
