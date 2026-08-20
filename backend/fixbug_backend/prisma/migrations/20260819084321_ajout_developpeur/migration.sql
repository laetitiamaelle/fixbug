-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DEVELOPPEUR';

-- AlterTable
ALTER TABLE "bugs" ADD COLUMN     "developpeurId" INTEGER,
ADD COLUMN     "proposition" TEXT;

-- AddForeignKey
ALTER TABLE "bugs" ADD CONSTRAINT "bugs_developpeurId_fkey" FOREIGN KEY ("developpeurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
