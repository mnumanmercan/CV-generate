-- AlterTable
ALTER TABLE "CV" ADD COLUMN "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CV_shareSlug_key" ON "CV"("shareSlug");
