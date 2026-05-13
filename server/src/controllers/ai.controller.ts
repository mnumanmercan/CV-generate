import { asyncHandler } from '../utils/asyncHandler.js'
import { aiService } from '../services/ai.service.js'
import type { AnalyzeSummaryInput } from '../schemas/ai.schema.js'

// Handler
export const aiController = {
  analyzeSummary: asyncHandler(async (req, res) => {
    const { summary } = req.body as AnalyzeSummaryInput
    const result = await aiService.analyzeSummary(summary)
    res.status(200).json({ success: true, data: result })
  }),
}
