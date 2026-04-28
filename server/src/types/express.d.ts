import type { TokenPayload } from '../utils/jwt.js'

declare global {
  namespace Express {
    interface Request {
      /**
       * Populated by `authenticate` (strict — request is rejected if absent)
       * or `authenticateOptional` (best-effort — may be undefined).
       *
       * Routes chained after `authenticate` can rely on this being defined.
       * Routes chained after `authenticateOptional` must null-check
       * (e.g. `req.user?.sub`).
       */
      user: TokenPayload

      /**
       * Raw request body. Populated by the `verify` callback on
       * `express.json()` in `app.ts` for the Stripe webhook path only.
       */
      rawBody?: Buffer
    }
  }
}

export {}
