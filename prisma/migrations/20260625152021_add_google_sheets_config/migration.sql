/*
  Warnings:

  - You are about to drop the `ProgramMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProgramMember" DROP CONSTRAINT "ProgramMember_programId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramMember" DROP CONSTRAINT "ProgramMember_userId_fkey";

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "sheetEvalDescCol" TEXT,
ADD COLUMN     "sheetEvalStatusCol" TEXT,
ADD COLUMN     "sheetId" TEXT,
ADD COLUMN     "sheetLastSyncAt" TIMESTAMP(3),
ADD COLUMN     "sheetName" TEXT,
ADD COLUMN     "sheetUniqueKey" TEXT;

-- DropTable
DROP TABLE "ProgramMember";

-- DropEnum
DROP TYPE "MemberStatus";

-- DropEnum
DROP TYPE "ProgramRole";
