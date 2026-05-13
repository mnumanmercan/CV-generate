-- CreateIndex
CREATE INDEX "CV_userId_updatedAt_idx" ON "CV"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "CoverLetter_userId_updatedAt_idx" ON "CoverLetter"("userId", "updatedAt" DESC);
