/*
  Warnings:

  - The values [MALE,FEMALE,OTHER] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('male', 'female', 'other');
ALTER TABLE "userProfile" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "public"."Gender_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name";
