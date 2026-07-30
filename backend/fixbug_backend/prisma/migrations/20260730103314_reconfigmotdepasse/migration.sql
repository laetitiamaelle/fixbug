/*
  Warnings:

  - You are about to drop the column `motDePasse` on the `utilisateurs` table. All the data in the column will be lost.
  - Added the required column `motdepasse` to the `utilisateurs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "utilisateurs" DROP COLUMN "motDePasse",
ADD COLUMN     "motdepasse" TEXT NOT NULL;
