/*
  Warnings:

  - You are about to drop the column `sheetEvalDescCol` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `sheetEvalStatusCol` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `sheetId` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `sheetLastSyncAt` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `sheetName` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `sheetUniqueKey` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the `ParticipantData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncLog` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `role` on the `ProgramMember` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `ProgramMember` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProgramMemberRole" AS ENUM ('ADMIN', 'VERIFIER');

-- CreateEnum
CREATE TYPE "ProgramMemberStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ParticipantEvalStatus" AS ENUM ('VERIFIED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "ParticipantData" DROP CONSTRAINT "ParticipantData_programId_fkey";

-- DropForeignKey
ALTER TABLE "SyncLog" DROP CONSTRAINT "SyncLog_programId_fkey";

-- AlterTable
ALTER TABLE "Program" DROP COLUMN "sheetEvalDescCol",
DROP COLUMN "sheetEvalStatusCol",
DROP COLUMN "sheetId",
DROP COLUMN "sheetLastSyncAt",
DROP COLUMN "sheetName",
DROP COLUMN "sheetUniqueKey",
ADD COLUMN     "headers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "uniqueKeyColumn" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "ProgramMember" DROP COLUMN "role",
ADD COLUMN     "role" "ProgramMemberRole" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ProgramMemberStatus" NOT NULL;

-- DropTable
DROP TABLE "ParticipantData";

-- DropTable
DROP TABLE "SyncLog";

-- DropEnum
DROP TYPE "SyncDirection";

-- DropEnum
DROP TYPE "SyncStatus";

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "uniqueKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "evalStatus" "ParticipantEvalStatus",
    "evalDescription" TEXT,
    "evalByUserId" TEXT,
    "evalByUserName" TEXT,
    "evalAt" TIMESTAMP(3),
    "searchText" TEXT NOT NULL DEFAULT '',
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Participant_programId_idx" ON "Participant"("programId");

-- CreateIndex
CREATE INDEX "Participant_programId_evalStatus_idx" ON "Participant"("programId", "evalStatus");

-- CreateIndex
CREATE INDEX "Participant_programId_rowIndex_idx" ON "Participant"("programId", "rowIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_programId_uniqueKey_key" ON "Participant"("programId", "uniqueKey");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_programId_rowIndex_key" ON "Participant"("programId", "rowIndex");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
