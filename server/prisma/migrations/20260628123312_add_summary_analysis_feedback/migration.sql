-- CreateEnum
CREATE TYPE "FeedbackVote" AS ENUM ('UP', 'DOWN');

-- CreateTable
CREATE TABLE "SummaryAnalysis" (
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

    CONSTRAINT "SummaryAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SummaryFeedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "analysisId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vote" "FeedbackVote" NOT NULL,
    "reasons" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SummaryFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SummaryAnalysis_userId_idx" ON "SummaryAnalysis"("userId");

-- CreateIndex
CREATE INDEX "SummaryAnalysis_promptVersion_idx" ON "SummaryAnalysis"("promptVersion");

-- CreateIndex
CREATE INDEX "SummaryAnalysis_createdAt_idx" ON "SummaryAnalysis"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SummaryFeedback_analysisId_key" ON "SummaryFeedback"("analysisId");

-- CreateIndex
CREATE INDEX "SummaryFeedback_userId_idx" ON "SummaryFeedback"("userId");

-- CreateIndex
CREATE INDEX "SummaryFeedback_vote_idx" ON "SummaryFeedback"("vote");

-- AddForeignKey
ALTER TABLE "SummaryAnalysis" ADD CONSTRAINT "SummaryAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummaryFeedback" ADD CONSTRAINT "SummaryFeedback_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "SummaryAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SummaryFeedback" ADD CONSTRAINT "SummaryFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
