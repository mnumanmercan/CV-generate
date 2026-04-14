import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { waitlistLimiter } from '../middleware/rateLimiter.js'
import { WaitlistSchema } from '@resumark/shared'
import { joinWaitlist } from '../controllers/waitlist.controller.js'

const router = Router()

router.post('/', waitlistLimiter, validate(WaitlistSchema), joinWaitlist)

export default router
