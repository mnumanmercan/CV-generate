import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma.js'
import { redis } from '../config/redis.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/apiError.js'
import {
  register,
  login,
  refreshTokens,
  revokeRefreshToken,
  createPasswordResetToken,
  resetPassword,
  verifyEmail,
  buildUserResponse,
  COOKIE_OPTIONS,
} from '../services/auth.service.js'
import { emailService } from '../services/email.service.js'
import { CVDataSchema, CoverLetterDataSchema } from '@resumark/shared'

// POST /auth/register
export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  let result: Awaited<ReturnType<typeof register>>
  try {
    result = await register(name, email, password)
  } catch (err: unknown) {
    const e = err as { statusCode?: number; code?: string; message: string }
    throw new AppError(e.message, e.statusCode ?? 500, e.code)
  }

  const { user, accessToken, refreshTokenRaw } = result

  res.cookie('refreshToken', refreshTokenRaw, COOKIE_OPTIONS)
  res.status(201).json({
    success:     true,
    accessToken,
    user:        buildUserResponse(user),
  })
})

// POST /auth/login
export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  let result: Awaited<ReturnType<typeof login>>
  try {
    result = await login(email, password)
  } catch (err: unknown) {
    const e = err as { statusCode?: number; code?: string; message: string }
    throw new AppError(e.message, e.statusCode ?? 500, e.code)
  }

  const { user, accessToken, refreshTokenRaw } = result

  res.cookie('refreshToken', refreshTokenRaw, COOKIE_OPTIONS)
  res.json({
    success:     true,
    accessToken,
    user:        buildUserResponse(user),
  })
})

// POST /auth/refresh
export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.['refreshToken'] as string | undefined
  if (!rawToken) throw new AppError('No refresh token', 401, 'MISSING_REFRESH_TOKEN')

  let result: Awaited<ReturnType<typeof refreshTokens>>
  try {
    result = await refreshTokens(rawToken)
  } catch (err: unknown) {
    const e = err as { statusCode?: number; code?: string; message: string }
    // Clear the invalid cookie
    res.clearCookie('refreshToken', { path: '/api/v1/auth' })
    throw new AppError(e.message, e.statusCode ?? 401, e.code)
  }

  const { accessToken, newRefreshTokenRaw } = result

  res.cookie('refreshToken', newRefreshTokenRaw, COOKIE_OPTIONS)
  res.json({ success: true, accessToken })
})

// POST /auth/logout
export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const { jti, exp } = req.user

  // Blacklist current access token until its natural expiry
  const ttlSeconds = exp - Math.floor(Date.now() / 1000)
  if (ttlSeconds > 0) {
    await redis.set(`bl:${jti}`, '1', { ex: ttlSeconds })
  }

  // Revoke refresh token from DB
  const rawToken = req.cookies?.['refreshToken'] as string | undefined
  if (rawToken) {
    await revokeRefreshToken(rawToken)
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth' })
  res.status(204).send()
})

// POST /auth/forgot-password
export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body

  const result = await createPasswordResetToken(email)
  if (result) {
    // Fire-and-forget email — don't fail the request if email fails
    emailService.sendPasswordReset(result.user.email, result.user.name, result.token).catch(console.error)
  }

  // Always return success to prevent email enumeration
  res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' })
})

// POST /auth/reset-password
export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body

  try {
    await resetPassword(token, newPassword)
  } catch (err: unknown) {
    const e = err as { statusCode?: number; code?: string; message: string }
    throw new AppError(e.message, e.statusCode ?? 400, e.code)
  }

  // Clear refresh cookie — user must log in again
  res.clearCookie('refreshToken', { path: '/api/v1/auth' })
  res.json({ success: true, message: 'Password updated. Please log in with your new password.' })
})

// POST /auth/verify-email
export const verifyEmailHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body

  try {
    await verifyEmail(token)
  } catch (err: unknown) {
    const e = err as { statusCode?: number; code?: string; message: string }
    throw new AppError(e.message, e.statusCode ?? 400, e.code)
  }

  res.json({ success: true, message: 'Email verified successfully.' })
})

// POST /auth/migrate-local-data
export const migrateLocalDataHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.sub
  const { cvData, coverLetterData } = req.body

  const results: Record<string, string> = {}

  // ── CV migration ──────────────────────────────────────────────────────────
  if (cvData) {
    const parsed = CVDataSchema.safeParse(cvData)
    if (!parsed.success) {
      results.cv = 'skipped_invalid'
    } else {
      const existing = await prisma.cV.findFirst({
        where:   { userId },
        orderBy: { updatedAt: 'desc' },
      })

      if (!existing) {
        await prisma.cV.create({
          data: {
            userId,
            content: parsed.data as object,
            title:   parsed.data.personal.fullName || 'My CV',
          },
        })
        results.cv = 'imported'
      } else {
        const cloudUpdatedAt = new Date(existing.updatedAt)
        const localUpdatedAt = new Date(parsed.data.meta.updatedAt)

        if (localUpdatedAt > cloudUpdatedAt) {
          await prisma.cV.update({
            where: { id: existing.id },
            data: {
              content: parsed.data as object,
              title:   parsed.data.personal.fullName || existing.title,
            },
          })
          results.cv = 'local_overwrote_cloud'
        } else {
          results.cv = 'cloud_kept'
        }
      }
    }
  }

  // ── Cover letter migration ────────────────────────────────────────────────
  if (coverLetterData) {
    const parsed = CoverLetterDataSchema.safeParse(coverLetterData)
    if (!parsed.success) {
      results.coverLetter = 'skipped_invalid'
    } else {
      const existing = await prisma.coverLetter.findFirst({ where: { userId } })

      if (!existing) {
        await prisma.coverLetter.create({
          data: { userId, content: parsed.data as object },
        })
        results.coverLetter = 'imported'
      } else {
        const cloudUpdatedAt = new Date(existing.updatedAt)
        const localUpdatedAt = new Date(parsed.data.meta.updatedAt)

        if (localUpdatedAt > cloudUpdatedAt) {
          await prisma.coverLetter.update({
            where: { id: existing.id },
            data:  { content: parsed.data as object },
          })
          results.coverLetter = 'local_overwrote_cloud'
        } else {
          results.coverLetter = 'cloud_kept'
        }
      }
    }
  }

  res.json({ success: true, results })
})
