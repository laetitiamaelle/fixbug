/*
  Warnings:

  - The values [BLOQUE] on the enum `StatutBug` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatutBug_new" AS ENUM ('EN_COURS_DE_TRAITEMENT', 'EN_ATTENTE_VALIDATION', 'RESOLU');
ALTER TABLE "public"."bugs" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "bugs" ALTER COLUMN "statut" TYPE "StatutBug_new" USING ("statut"::text::"StatutBug_new");
ALTER TYPE "StatutBug" RENAME TO "StatutBug_old";
ALTER TYPE "StatutBug_new" RENAME TO "StatutBug";
DROP TYPE "public"."StatutBug_old";
ALTER TABLE "bugs" ALTER COLUMN "statut" SET DEFAULT 'EN_COURS_DE_TRAITEMENT';
COMMIT;
