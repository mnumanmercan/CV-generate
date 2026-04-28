import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { redis } from '../config/redis.js'
import { AppError } from '../utils/apiError.js'

/**
 * Core logic shared by the strict and optional middlewares.
 * Returns true if the request carries a valid, non-blacklisted token
 * and populates `req.user`. Returns false on any failure.
 */
async function tryAuthenticate(req: Request): Promise<boolean> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return false

  try {
    const payload = verifyAccessToken(authHeader.slice(7))

    // O(1) Redis blacklist check (logout invalidates by jti)
    const blacklisted = await redis.get(`bl:${payload.jti}`)
    if (blacklisted) return false

    req.user = payload
    return true
  } catch {
    return false
  }
}

/**
 * Strict authenticate — 401 if no valid token. Use on routes that require
 * the user to be logged in.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('No access token provided', 401, 'UNAUTHORIZED'))
    return
  }

  const ok = await tryAuthenticate(req)
  if (!ok) {
    next(new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN'))
    return
  }
  next()
}

/**
 * Optional authenticate — never blocks. Populates `req.user` if a valid token
 * is present (including passing the blacklist check), leaves it undefined
 * otherwise. Use on routes that work for both guests and logged-in users but
 * want to link the action to the account when possible (e.g. waitlist).
 */
export async function authenticateOptional(req: Request, _res: Response, next: NextFunction): Promise<void> {
  await tryAuthenticate(req)
  next()
}
