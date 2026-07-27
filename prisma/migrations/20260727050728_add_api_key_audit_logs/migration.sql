-- AlterTable
ALTER TABLE "ProgramApiKey" ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProgramApiKeyLog" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" INTEGER NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramApiKeyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramApiKeyLog_apiKeyId_idx" ON "ProgramApiKeyLog"("apiKeyId");

-- CreateIndex
CREATE INDEX "ProgramApiKeyLog_createdAt_idx" ON "ProgramApiKeyLog"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ProgramApiKeyLog" ADD CONSTRAINT "ProgramApiKeyLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ProgramApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
