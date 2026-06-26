-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE', 'STOPPED');

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE';
