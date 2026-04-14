import type { Request, Response, NextFunction } from 'express'

// Capture raw body for Stripe webhook signature verification.
// Must be applied BEFORE express.json() on the webhook route.
export function captureRawBody(req: Request, res: Response, next: NextFunction): void {
  const chunks: Buffer[] = []
  req.on('data', (chunk: Buffer) => chunks.push(chunk))
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks)
    next()
  })
  req.on('error', next)
}
