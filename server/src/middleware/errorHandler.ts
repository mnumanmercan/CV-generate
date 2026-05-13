import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/apiError.js'
import { logger } from '../utils/logger.js'

interface ErrorWithDetails extends AppError {
  details?: unknown
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // pino-http attaches `req.id`; surface it back so a support ticket like
  // "I got an error, request id abc123" can be grepped directly from logs.
  const requestId = req.id

  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      success: false,
      error: {
        code: err.code ?? 'ERROR',
        message: err.message,
      },
      requestId,
    }
    // Include Zod field errors in development
    if (process.env.NODE_ENV !== 'production') {
      const details = (err as ErrorWithDetails).details
      if (details) body.error = { ...(body.error as object), details }
    }
    res.status(err.statusCode).json(body)
    return
  }

  // Unexpected errors — log with the request's structured logger so the
  // entry is correlated to its request id; do not leak internals to the
  // client in production.
  ;(req.log ?? logger).error({ err }, 'Unhandled error')
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV !== 'production' ? err.message : 'An unexpected error occurred',
    },
    requestId,
  })
}
