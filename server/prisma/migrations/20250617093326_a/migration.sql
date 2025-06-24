/*
  Warnings:

  - You are about to drop the column `topAnimes` on the `List` table. All the data in the column will be lost.
  - You are about to drop the column `topCount` on the `List` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "List" DROP COLUMN "topAnimes",
DROP COLUMN "topCount";
