-- CreateTable
CREATE TABLE "projets" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "liengit" TEXT NOT NULL,
    "technologie" TEXT[],
    "chefProjetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projet_collaborateurs" (
    "id" SERIAL NOT NULL,
    "projetId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projet_collaborateurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projet_collaborateurs_projetId_utilisateurId_key" ON "projet_collaborateurs"("projetId", "utilisateurId");

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_chefProjetId_fkey" FOREIGN KEY ("chefProjetId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projet_collaborateurs" ADD CONSTRAINT "projet_collaborateurs_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projet_collaborateurs" ADD CONSTRAINT "projet_collaborateurs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
