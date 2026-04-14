import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { Plan } from '@prisma/client'

// SignPayload: what callers pass to signAccessToken (no jti/iat/exp — set automatically)
export interface SignPayload {
  sub:   string
  email: string
  plan:  Plan
}

// TokenPayload: what you get back after verifying (includes JWT standard claims)
export interface TokenPayload extends SignPayload {
  jti: string
  iat: number
  exp: number
}

const privateKey = Buffer.from(env.JWT_PRIVATE_KEY_B64, 'base64').toString('utf8')
const publicKey  = Buffer.from(env.JWT_PUBLIC_KEY_B64,  'base64').toString('utf8')

export function signAccessToken(payload: SignPayload): string {
  const jti = crypto.randomUUID()
  return jwt.sign({ ...payload, jti }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '15m',
  })
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as TokenPayload
}
