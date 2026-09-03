// ─── Typed storage error ──────────────────────────────────────────────────────
// Shared by both storage backends (localStorage and API) so callers can
// distinguish between error types and show appropriate UI feedback. Lives in
// its own module because storageService.ts (local backend) and
// apiStorageService.ts (cloud backend) both throw it — importing it from
// either one would create a cycle.

export type StorageErrorReason =
  | 'not_found'
  | 'unauthorized'
  | 'network'
  | 'rate_limited'
  /** HTTP 413 — payload exceeds the server body limit. */
  | 'too_large'
  /** HTTP 422 — the server's Zod validation rejected the document. */
  | 'invalid'
  /** HTTP 402 — the plan's CV limit is already reached; creating another needs an upgrade. */
  | 'plan_limit'
  /** localStorage quota exceeded (guest users). */
  | 'quota_exceeded'
  /** localStorage disabled entirely (private mode, browser settings). */
  | 'unavailable'
  | 'unknown'

export class StorageError extends Error {
  // Plain field instead of the constructor-parameter shorthand because the
  // app tsconfig enables `erasableSyntaxOnly` (which forbids emitted runtime
  // assignments from parameter properties).
  readonly reason: StorageErrorReason
  /** For `rate_limited`: how long to wait before retrying (ms), if the server said. */
  readonly retryAfterMs: number | undefined

  constructor(reason: StorageErrorReason, message: string, retryAfterMs?: number) {
    super(message)
    this.reason = reason
    this.retryAfterMs = retryAfterMs
    this.name = 'StorageError'
  }
}

/**
 * Reasons that retrying the same payload cannot fix — the document itself (or
 * the storage medium) is the problem, so the user must be told immediately.
 * Transient reasons (network, unknown) only surface after repeated failures.
 */
export function isTerminalReason(reason: StorageErrorReason): boolean {
  return (
    reason === 'too_large' ||
    reason === 'invalid' ||
    reason === 'plan_limit' ||
    reason === 'quota_exceeded' ||
    reason === 'unavailable'
  )
}
