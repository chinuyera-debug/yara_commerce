/*
  Warnings:

  - You are about to drop the column `aadharCard` on the `sellerDocs` table. All the data in the column will be lost.
  - You are about to drop the column `aadhardPicture` on the `sellerDocs` table. All the data in the column will be lost.
  - You are about to drop the column `panCard` on the `sellerDocs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sellerDocs" DROP COLUMN "aadharCard",
DROP COLUMN "aadhardPicture",
DROP COLUMN "panCard",
ADD COLUMN     "aadharCardBack" TEXT,
ADD COLUMN     "aadharCardFront" TEXT,
ADD COLUMN     "panCardBack" TEXT,
ADD COLUMN     "panCardFront" TEXT;
