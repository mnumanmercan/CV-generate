import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { redis } from '../config/redis.js'
import { AppError } from '../utils/apiError.js'

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('No access token provided', 401, 'UNAUTHORIZED'))
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyAccessToken(token)

    // O(1) Redis blacklist check (logout invalidates by jti)
    const blacklisted = await redis.get(`bl:${payload.jti}`)
    if (blacklisted) {
      next(new AppError('Token has been revoked', 401, 'TOKEN_REVOKED'))
      return
    }

    req.user = payload
    next()
  } catch {
    next(new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN'))
  }
}
