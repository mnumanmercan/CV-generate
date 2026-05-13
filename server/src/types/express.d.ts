import type { TokenPayload } from '../utils/jwt.js'

declare global {
  namespace Express {
    interface Request {
      /**
       * Populated by `authenticate` (strict — request is rejected if absent)
       * or `authenticateOptional` (best-effort — may be undefined).
       *
       * Typed as optional so `authenticateOptional` consumers don't have to
       * cast through `unknown`. Routes chained after `authenticate` can
       * safely use the non-null assertion `req.user!` since the middleware
       * has guaranteed presence by the time the handler runs.
       */
      user?: TokenPayload

      /**
       * Raw request body. Populated by the `verify` callback on
       * `express.json()` in `app.ts` for the Stripe webhook path only.
       */
      rawBody?: Buffer
    }
  }
}

export {}
