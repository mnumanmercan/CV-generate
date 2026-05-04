import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { apiReadLimiter, apiWriteLimiter } from '../middleware/rateLimiter.js'
import { UpsertCoverLetterSchema } from '@resumark/shared'
import { getCoverLetter, upsertCoverLetter, deleteCoverLetter } from '../controllers/coverLetter.controller.js'

const router = Router()

// All cover letter routes require auth
router.use(authenticate)

router.get('/',    apiReadLimiter,  getCoverLetter)
router.put('/',    apiWriteLimiter, validate(UpsertCoverLetterSchema), upsertCoverLetter)
router.delete('/', deleteCoverLetter)

export default router
