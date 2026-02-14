/*
  Warnings:

  - You are about to drop the column `isSeller` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isSeller";

-- CreateTable
CREATE TABLE "sellerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRequestedForSeller" BOOLEAN NOT NULL DEFAULT false,
    "shopName" TEXT,
    "gstNumber" TEXT,
    "isApprovedByAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sellerAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "district" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,

    CONSTRAINT "sellerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sellerDocs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "panCard" TEXT,
    "aadharCard" TEXT,
    "aadhardPicture" TEXT,

    CONSTRAINT "sellerDocs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sellerProfile_userId_key" ON "sellerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sellerAddress_userId_key" ON "sellerAddress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sellerDocs_userId_key" ON "sellerDocs"("userId");

-- AddForeignKey
ALTER TABLE "sellerProfile" ADD CONSTRAINT "sellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sellerAddress" ADD CONSTRAINT "sellerAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "sellerProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sellerDocs" ADD CONSTRAINT "sellerDocs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "sellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
