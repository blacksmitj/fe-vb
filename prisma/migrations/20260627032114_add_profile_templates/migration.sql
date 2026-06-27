-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "profileTemplateId" TEXT;

-- CreateTable
CREATE TABLE "ProfileTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sections" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_profileTemplateId_fkey" FOREIGN KEY ("profileTemplateId") REFERENCES "ProfileTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
