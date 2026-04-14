import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/apiError.js'

interface ErrorWithDetails extends AppError {
  details?: unknown
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      success: false,
      error: {
        code:    err.code ?? 'ERROR',
        message: err.message,
      },
    }
    // Include Zod field errors in development
    if (process.env.NODE_ENV !== 'production') {
      const details = (err as ErrorWithDetails).details
      if (details) body.error = { ...body.error as object, details }
    }
    res.status(err.statusCode).json(body)
    return
  }

  // Unexpected errors — don't leak internals
  console.error('[Unhandled error]', err)
  res.status(500).json({
    success: false,
    error: {
      code:    'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV !== 'production' ? err.message : 'An unexpected error occurred',
    },
  })
}
