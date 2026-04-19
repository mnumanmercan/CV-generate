import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { env } from '../config/env.js'
import { signAccessToken } from '../utils/jwt.js'
import { sha256 } from '../utils/hash.js'

// Default refresh TTL: 7 days. When the user opts in to "remember me" at
// login time, we extend to 30 days (both the DB token expiry and the cookie
// maxAge). Keep these as named constants so the doubled-up 30d semantics
// stay aligned between the DB row and the browser cookie.
const REFRESH_TOKEN_TTL_MS          = 7  * 24 * 60 * 60 * 1000 // 7 days
const REFRESH_TOKEN_REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

type PrismaTransaction = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Build cookie options for the refresh token. `remember = true` extends the
 * cookie lifetime to 30 days so a user on their own device isn't kicked out
 * weekly. Defaults to 7 days, which also matches the DB token expiry when
 * `issueRefreshToken` is called without `remember`.
 */
export function buildCookieOptions(remember = false) {
  return {
    httpOnly: true,
    secure:   env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge:   remember ? REFRESH_TOKEN_REMEMBER_TTL_MS : REFRESH_TOKEN_TTL_MS,
    path:     '/api/v1/auth',
  }
}

// Preserved for backwards compatibility with any caller that doesn't pass
// the `remember` flag (e.g. the register handler, which never offers the
// checkbox). Equivalent to `buildCookieOptions(false)`.
export const COOKIE_OPTIONS = buildCookieOptions(false)

// ─── Issue a new opaque refresh token ─────────────────────────────────────────

async function issueRefreshToken(
  userId: string,
  tx: PrismaTransaction,
  remember = false,
): Promise<string> {
  const raw       = crypto.randomBytes(32).toString('hex')
  const tokenHash = sha256(raw)
  const ttlMs     = remember ? REFRESH_TOKEN_REMEMBER_TTL_MS : REFRESH_TOKEN_TTL_MS
  const expiresAt = new Date(Date.now() + ttlMs)

  await tx.token.create({
    data: { userId, tokenHash, type: 'REFRESH', expiresAt },
  })

  return raw
}

// ─── Build user response object ────────────────────────────────────────────────

export function buildUserResponse(user: { id: string; name: string; email: string; plan: string }) {
  const isPremium = user.plan === 'PRO' || user.plan === 'ENTERPRISE'
  return {
    id:        user.id,
    name:      user.name,
    email:     user.email,
    plan:      user.plan,
    isPremium,
    avatarUrl: null as string | null,
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw Object.assign(new Error('An account with this email already exists.'), { statusCode: 409, code: 'EMAIL_TAKEN' })
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

  const { user, accessToken, refreshTokenRaw, verifyTokenRaw } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    })

    const refreshTokenRaw = await issueRefreshToken(user.id, tx)
    const accessToken = signAccessToken({ sub: user.id, email: user.email, plan: user.plan })

    // Create email-verification token — actual sending is the controller's
    // responsibility (fire-and-forget) so registration doesn't block on SMTP
    // latency or fail if Resend is temporarily down.
    const verifyRaw   = crypto.randomBytes(32).toString('hex')
    const verifyHash  = sha256(verifyRaw)
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await tx.token.create({
      data: { userId: user.id, tokenHash: verifyHash, type: 'EMAIL_VERIFY', expiresAt: verifyExpiry },
    })

    return { user, accessToken, refreshTokenRaw, verifyTokenRaw: verifyRaw }
  })

  return { user, accessToken, refreshTokenRaw, verifyTokenRaw }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string, rememberMe = false) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401, code: 'INVALID_CREDENTIALS' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401, code: 'INVALID_CREDENTIALS' })
  }

  const { accessToken, refreshTokenRaw } = await prisma.$transaction(async (tx) => {
    const refreshTokenRaw = await issueRefreshToken(user.id, tx, rememberMe)
    const accessToken = signAccessToken({ sub: user.id, email: user.email, plan: user.plan })
    return { accessToken, refreshTokenRaw }
  })

  return { user, accessToken, refreshTokenRaw, rememberMe }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

export async function refreshTokens(rawToken: string) {
  const tokenHash = sha256(rawToken)

  const tokenRecord = await prisma.token.findUnique({
    where:   { tokenHash },
    include: { user: true },
  })

  if (
    !tokenRecord ||
    tokenRecord.type !== 'REFRESH' ||
    tokenRecord.revokedAt !== null ||
    tokenRecord.expiresAt < new Date()
  ) {
    throw Object.assign(new Error('Invalid or expired refresh token.'), { statusCode: 401, code: 'INVALID_REFRESH_TOKEN' })
  }

  const { user } = tokenRecord

  const { accessToken, newRefreshTokenRaw } = await prisma.$transaction(async (tx) => {
    // Rotate: revoke old token
    await tx.token.update({
      where: { id: tokenRecord.id },
      data:  { revokedAt: new Date() },
    })

    const newRefreshTokenRaw = await issueRefreshToken(user.id, tx)
    const accessToken = signAccessToken({ sub: user.id, email: user.email, plan: user.plan })
    return { accessToken, newRefreshTokenRaw }
  })

  return { user, accessToken, newRefreshTokenRaw }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = sha256(rawToken)
  await prisma.token.updateMany({
    where: { tokenHash, type: 'REFRESH', revokedAt: null },
    data:  { revokedAt: new Date() },
  })
}

// ─── Forgot password ──────────────────────────────────────────────────────────

export async function createPasswordResetToken(email: string): Promise<{ token: string; user: { name: string; email: string } } | null> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null // silently return null — don't leak account existence

  // Revoke any existing password reset tokens
  await prisma.token.updateMany({
    where: { userId: user.id, type: 'PASSWORD_RESET', revokedAt: null },
    data:  { revokedAt: new Date() },
  })

  const raw       = crypto.randomBytes(32).toString('hex')
  const tokenHash = sha256(raw)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.token.create({
    data: { userId: user.id, tokenHash, type: 'PASSWORD_RESET', expiresAt },
  })

  return { token: raw, user: { name: user.name, email: user.email } }
}

// ─── Reset password ───────────────────────────────────────────────────────────

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = sha256(rawToken)

  const tokenRecord = await prisma.token.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (
    !tokenRecord ||
    tokenRecord.type !== 'PASSWORD_RESET' ||
    tokenRecord.revokedAt !== null ||
    tokenRecord.expiresAt < new Date()
  ) {
    throw Object.assign(new Error('Invalid or expired password reset link.'), { statusCode: 400, code: 'INVALID_RESET_TOKEN' })
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS)

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: tokenRecord.userId },
      data:  { passwordHash },
    })
    // Mark reset token used
    await tx.token.update({
      where: { id: tokenRecord.id },
      data:  { revokedAt: new Date() },
    })
    // Revoke all refresh tokens — force re-login everywhere
    await tx.token.updateMany({
      where: { userId: tokenRecord.userId, type: 'REFRESH', revokedAt: null },
      data:  { revokedAt: new Date() },
    })
  })
}

// ─── Verify email ─────────────────────────────────────────────────────────────

export async function verifyEmail(rawToken: string): Promise<void> {
  const tokenHash = sha256(rawToken)

  const tokenRecord = await prisma.token.findUnique({ where: { tokenHash } })

  if (
    !tokenRecord ||
    tokenRecord.type !== 'EMAIL_VERIFY' ||
    tokenRecord.revokedAt !== null ||
    tokenRecord.expiresAt < new Date()
  ) {
    throw Object.assign(new Error('Invalid or expired verification link.'), { statusCode: 400, code: 'INVALID_VERIFY_TOKEN' })
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: tokenRecord.userId },
      data:  { emailVerified: true },
    })
    await tx.token.update({
      where: { id: tokenRecord.id },
      data:  { revokedAt: new Date() },
    })
  })
}
