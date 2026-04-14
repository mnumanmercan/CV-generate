import { z } from 'zod'

export const WaitlistSchema = z.object({
  email:  z.string().email().max(254).toLowerCase(),
  source: z.string().max(50).optional().default('upgrade_modal'),
})
