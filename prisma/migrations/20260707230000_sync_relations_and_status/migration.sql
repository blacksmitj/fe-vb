-- AlterEnum
ALTER TYPE "ParticipantEvalStatus" ADD VALUE 'REVERIFICATION';

-- AlterTable
ALTER TABLE "ProfileTemplate" ADD COLUMN     "programId" TEXT;

-- AlterTable
ALTER TABLE "Program" DROP COLUMN "profileTemplateId";

-- CreateIndex
CREATE UNIQUE INDEX "ProfileTemplate_programId_key" ON "ProfileTemplate"("programId");

-- AddForeignKey
ALTER TABLE "ProfileTemplate" ADD CONSTRAINT "ProfileTemplate_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
