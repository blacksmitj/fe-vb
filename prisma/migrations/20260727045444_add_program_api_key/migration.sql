-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "ProgramApiKey" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Google Apps Script Key',
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramApiKey_programId_key" ON "ProgramApiKey"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramApiKey_key_key" ON "ProgramApiKey"("key");

-- CreateIndex
CREATE INDEX "ProgramApiKey_key_idx" ON "ProgramApiKey"("key");

-- CreateIndex
CREATE INDEX "ProgramApiKey_programId_idx" ON "ProgramApiKey"("programId");

-- AddForeignKey
ALTER TABLE "ProgramApiKey" ADD CONSTRAINT "ProgramApiKey_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
