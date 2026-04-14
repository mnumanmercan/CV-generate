import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError } from '../utils/apiError.js'

export function validate(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const details = result.error instanceof ZodError
        ? result.error.flatten().fieldErrors
        : undefined
      const err = new AppError('Validation failed', 422, 'VALIDATION_ERROR') as AppError & { details?: unknown }
      err.details = details
      next(err)
      return
    }
    req.body = result.data
    next()
  }
}
