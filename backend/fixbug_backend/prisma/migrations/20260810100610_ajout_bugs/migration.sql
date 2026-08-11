-- CreateEnum
CREATE TYPE "StatutBug" AS ENUM ('EN_COURS_DE_TRAITEMENT', 'EN_ATTENTE_VALIDATION', 'BLOQUE', 'RESOLU');

-- CreateTable
CREATE TABLE "bugs" (
    "id" SERIAL NOT NULL,
    "titre" TEXT,
    "description" TEXT NOT NULL,
    "captures" TEXT[],
    "statut" "StatutBug" NOT NULL DEFAULT 'EN_COURS_DE_TRAITEMENT',
    "projetId" INTEGER NOT NULL,
    "testeurId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bugs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bugs" ADD CONSTRAINT "bugs_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bugs" ADD CONSTRAINT "bugs_testeurId_fkey" FOREIGN KEY ("testeurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
