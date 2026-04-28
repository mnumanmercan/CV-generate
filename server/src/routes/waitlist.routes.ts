import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { waitlistLimiter } from '../middleware/rateLimiter.js'
import { authenticateOptional } from '../middleware/authenticate.js'
import { WaitlistSchema } from '@resumark/shared'
import { joinWaitlist } from '../controllers/waitlist.controller.js'

const router = Router()

// `authenticateOptional` runs the same blacklist check as `authenticate` but
// doesn't reject requests without a token. This closes the bypass where a
// revoked (blacklisted) token was still accepted by the inline verify in
// the waitlist controller.
router.post('/', waitlistLimiter, authenticateOptional, validate(WaitlistSchema), joinWaitlist)

export default router
