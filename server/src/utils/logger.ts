import { pino } from 'pino'
import { env } from '../config/env.js'

// One pino instance shared across the server. The redact list covers fields
// that should never land in logs even if a request body or error happens to
// carry them — auth headers, cookies, password/token shapes we use in Prisma.
// Add to this list, do not subtract from it.
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { service: 'resumark-server', env: env.NODE_ENV },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.tokenHash',
      '*.accessToken',
      '*.refreshToken',
      '*.refreshTokenRaw',
      '*.verifyTokenRaw',
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})
