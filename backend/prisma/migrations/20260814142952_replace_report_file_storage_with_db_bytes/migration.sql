/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Report` table. All the data in the column will be lost.
  - Added the required column `contentType` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileContent` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filename` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "fileUrl",
ADD COLUMN     "contentType" TEXT NOT NULL,
ADD COLUMN     "fileContent" BYTEA NOT NULL,
ADD COLUMN     "filename" TEXT NOT NULL;
