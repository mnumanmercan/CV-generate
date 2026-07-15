-- CreateEnum
CREATE TYPE "CoverLetterPart" AS ENUM ('OPENING', 'BODY_WHY', 'BODY_BRING', 'CLOSING');

-- CreateTable
CREATE TABLE "CoverLetterAnalysis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cacheReadTokens" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverLetterAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverLetterFeedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "analysisId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "part" "CoverLetterPart" NOT NULL,
    "vote" "FeedbackVote" NOT NULL,
    "reasons" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverLetterFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoverLetterAnalysis_userId_idx" ON "CoverLetterAnalysis"("userId");

-- CreateIndex
CREATE INDEX "CoverLetterAnalysis_promptVersion_idx" ON "CoverLetterAnalysis"("promptVersion");

-- CreateIndex
CREATE INDEX "CoverLetterAnalysis_createdAt_idx" ON "CoverLetterAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "CoverLetterFeedback_userId_idx" ON "CoverLetterFeedback"("userId");

-- CreateIndex
CREATE INDEX "CoverLetterFeedback_vote_idx" ON "CoverLetterFeedback"("vote");

-- CreateIndex
CREATE UNIQUE INDEX "CoverLetterFeedback_analysisId_part_key" ON "CoverLetterFeedback"("analysisId", "part");

-- AddForeignKey
ALTER TABLE "CoverLetterAnalysis" ADD CONSTRAINT "CoverLetterAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetterFeedback" ADD CONSTRAINT "CoverLetterFeedback_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CoverLetterAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetterFeedback" ADD CONSTRAINT "CoverLetterFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
