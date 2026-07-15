import type { CoverLetterPart } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { AppError } from '../utils/apiError.js'
import type { CoverLetterPartKey, SubmitCoverLetterFeedbackInput } from '@resumark/shared'

// Wire keys (CoverLetterData field names) → Prisma enum values.
const PART_TO_ENUM: Record<CoverLetterPartKey, CoverLetterPart> = {
  opening: 'OPENING',
  bodyWhy: 'BODY_WHY',
  bodyBring: 'BODY_BRING',
  closing: 'CLOSING',
}

export const coverLetterFeedbackService = {
  // Record (or change) a user's up/down vote on ONE PART of one of their
  // cover-letter analyses.
  async record(userId: string, input: SubmitCoverLetterFeedbackInput) {
    // Ownership: the analysis must exist and belong to the caller. 404 on
    // mismatch (a 403 would leak that the id exists), mirroring cvService.
    const analysis = await prisma.coverLetterAnalysis.findUnique({
      where: { id: input.analysisId },
      select: { userId: true },
    })
    if (!analysis || analysis.userId !== userId) {
      throw new AppError('Analysis not found.', 404, 'NOT_FOUND')
    }

    // Reasons only carry meaning on a downvote; never persist stray codes on an
    // upvote. De-dupe so the same chip tapped twice doesn't double-count.
    const reasons =
      input.vote === 'DOWN' && input.reasons?.length ? Array.from(new Set(input.reasons)) : []

    const part = PART_TO_ENUM[input.part]

    // One vote per (analysis, part) — the compound unique. Upsert lets the
    // user flip a vote on one part without touching the other three.
    return prisma.coverLetterFeedback.upsert({
      where: { analysisId_part: { analysisId: input.analysisId, part } },
      create: { analysisId: input.analysisId, userId, part, vote: input.vote, reasons },
      update: { vote: input.vote, reasons },
      select: { analysisId: true, part: true, vote: true, reasons: true },
    })
  },
}
