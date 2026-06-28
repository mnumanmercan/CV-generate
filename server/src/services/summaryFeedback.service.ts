import { prisma } from '../db/prisma.js'
import { AppError } from '../utils/apiError.js'
import type { SubmitFeedbackInput } from '@resumark/shared'

export const summaryFeedbackService = {
  // Record (or change) a user's up/down vote on one of their analyses.
  async record(userId: string, input: SubmitFeedbackInput) {
    // Ownership: the analysis must exist and belong to the caller. 404 on
    // mismatch (a 403 would leak that the id exists), mirroring cvService.
    const analysis = await prisma.summaryAnalysis.findUnique({
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

    // One vote per analysis (unique analysisId). Upsert lets the user flip it.
    return prisma.summaryFeedback.upsert({
      where: { analysisId: input.analysisId },
      create: { analysisId: input.analysisId, userId, vote: input.vote, reasons },
      update: { vote: input.vote, reasons },
      select: { analysisId: true, vote: true, reasons: true },
    })
  },
}
