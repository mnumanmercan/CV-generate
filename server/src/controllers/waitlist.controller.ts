import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../db/prisma.js'
import { emailService } from '../services/email.service.js'
import { verifyAccessToken } from '../utils/jwt.js'

export const joinWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const { email, source } = req.body as { email: string; source?: string }

  const existing = await prisma.waitlistEntry.findUnique({ where: { email } })
  if (existing) {
    // Idempotent — silently succeed to avoid enumeration
    res.status(200).json({ success: true, alreadyRegistered: true })
    return
  }

  // If a valid access token is present, link the waitlist entry to the account
  let userId: string | null = null
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7))
      userId = payload.sub
    } catch {
      // Invalid token is fine here — waitlist doesn't require auth
    }
  }

  await prisma.waitlistEntry.create({
    data: { email, source: source ?? 'upgrade_modal', userId },
  })

  // Fire-and-forget confirmation email
  emailService.sendWaitlistConfirmation(email).catch(console.error)

  res.status(201).json({ success: true })
})
