import { asyncHandler } from '../utils/asyncHandler.js'
import { aiService } from '../services/ai.service.js'
import type { AnalyzeSummaryInput } from '@resumark/shared'

// Handler
export const aiController = {
  analyzeSummary: asyncHandler(async (req, res) => {
    const input = req.body as AnalyzeSummaryInput
    // `authenticate` guarantees req.user; fall back to FREE defensively.
    const plan = req.user?.plan ?? 'FREE'
    const result = await aiService.analyzeSummary(input, plan)
    res.status(200).json({ success: true, data: result })
  }),
}
