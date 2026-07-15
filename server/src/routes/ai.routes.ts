import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { aiLimiter, apiWriteLimiter } from '../middleware/rateLimiter.js'
import { validate } from '../middleware/validate.js'
import {
  AnalyzeSummarySchema,
  SubmitFeedbackSchema,
  AnalyzeCoverLetterSchema,
  SubmitCoverLetterFeedbackSchema,
} from '@resumark/shared'
import { aiController } from '../controllers/ai.controller.js'

const router = Router()

router.post(
  '/analyze-summary',
  authenticate,
  aiLimiter,
  validate(AnalyzeSummarySchema),
  aiController.analyzeSummary,
)

// Voting is a cheap, user-initiated write — the general write budget (60/min)
// fits, no need for the strict AI-call limiter.
router.post(
  '/feedback',
  authenticate,
  apiWriteLimiter,
  validate(SubmitFeedbackSchema),
  aiController.submitFeedback,
)

router.post(
  '/analyze-cover-letter',
  authenticate,
  aiLimiter,
  validate(AnalyzeCoverLetterSchema),
  aiController.analyzeCoverLetter,
)

router.post(
  '/cover-letter-feedback',
  authenticate,
  apiWriteLimiter,
  validate(SubmitCoverLetterFeedbackSchema),
  aiController.submitCoverLetterFeedback,
)

export default router
