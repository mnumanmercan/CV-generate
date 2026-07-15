import { asyncHandler } from '../utils/asyncHandler.js'
import { aiService } from '../services/ai.service.js'
import { summaryFeedbackService } from '../services/summaryFeedback.service.js'
import { coverLetterFeedbackService } from '../services/coverLetterFeedback.service.js'
import { AppError } from '../utils/apiError.js'
import type {
  AnalyzeSummaryInput,
  SubmitFeedbackInput,
  AnalyzeCoverLetterInput,
  SubmitCoverLetterFeedbackInput,
} from '@resumark/shared'

// Handler
export const aiController = {
  analyzeSummary: asyncHandler(async (req, res) => {
    const input = req.body as AnalyzeSummaryInput
    // `authenticate` guarantees req.user; assert defensively for the type and
    // because we now persist the analysis against the owning user id.
    const userId = req.user?.sub
    if (!userId) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED')
    const plan = req.user?.plan ?? 'FREE'
    const result = await aiService.analyzeSummary(input, userId, plan)
    res.status(200).json({ success: true, data: result })
  }),

  submitFeedback: asyncHandler(async (req, res) => {
    const input = req.body as SubmitFeedbackInput
    const userId = req.user?.sub
    if (!userId) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED')
    const data = await summaryFeedbackService.record(userId, input)
    res.status(200).json({ success: true, data })
  }),

  analyzeCoverLetter: asyncHandler(async (req, res) => {
    const input = req.body as AnalyzeCoverLetterInput
    const userId = req.user?.sub
    if (!userId) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED')
    const plan = req.user?.plan ?? 'FREE'
    const result = await aiService.analyzeCoverLetter(input, userId, plan)
    res.status(200).json({ success: true, data: result })
  }),

  submitCoverLetterFeedback: asyncHandler(async (req, res) => {
    const input = req.body as SubmitCoverLetterFeedbackInput
    const userId = req.user?.sub
    if (!userId) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED')
    const data = await coverLetterFeedbackService.record(userId, input)
    res.status(200).json({ success: true, data })
  }),
}
