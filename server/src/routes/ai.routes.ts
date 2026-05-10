import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { aiLimiter } from '../middleware/rateLimiter.js'
import { validate } from '../middleware/validate.js'
import { AnalyzeSummarySchema } from '../schemas/ai.schema.js'
import { aiController } from '../controllers/ai.controller.js'

const router = Router()

router.post(
  '/analyze-summary',
  authenticate,
  aiLimiter,
  validate(AnalyzeSummarySchema),
  aiController.analyzeSummary,
)

export default router
