-- CreateTable
CREATE TABLE "VerificationHistory" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "evalStatus" "ParticipantEvalStatus" NOT NULL,
    "evalDescription" TEXT,
    "evalByUserId" TEXT NOT NULL,
    "evalByUserName" TEXT NOT NULL,
    "evalAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationHistory_participantId_idx" ON "VerificationHistory"("participantId");

-- CreateIndex
CREATE INDEX "VerificationHistory_evalAt_idx" ON "VerificationHistory"("evalAt" ASC);

-- AddForeignKey
ALTER TABLE "VerificationHistory" ADD CONSTRAINT "VerificationHistory_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
