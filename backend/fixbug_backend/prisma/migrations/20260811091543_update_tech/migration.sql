/*
  Warnings:

  - You are about to drop the column `technologie` on the `projets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projets" DROP COLUMN "technologie",
ADD COLUMN     "technologies" TEXT[];
