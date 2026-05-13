import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { prisma } from '../db/prisma.js'
import { emailService } from '../services/email.service.js'

export const joinWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const { email, source } = req.body as { email: string; source?: string }

  const existing = await prisma.waitlistEntry.findUnique({ where: { email } })
  if (existing) {
    // Idempotent — silently succeed to avoid enumeration
    res.status(200).json({ success: true, alreadyRegistered: true })
    return
  }

  // `authenticateOptional` middleware populates req.user when a valid,
  // non-blacklisted access token is present. The Request['user'] type is
  // now declared optional, so consumers of optional auth can read it
  // directly without casting through `unknown`.
  const userId = req.user?.sub ?? null

  await prisma.waitlistEntry.create({
    data: { email, source: source ?? 'upgrade_modal', userId },
  })

  // Fire-and-forget confirmation email
  emailService.sendWaitlistConfirmation(email).catch(console.error)

  res.status(201).json({ success: true })
})
