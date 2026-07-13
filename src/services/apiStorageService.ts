import type { CVData } from '@/types/cv.types'
import type { CoverLetterData } from '@/types/coverLetter.types'
import type { StorageService } from './storageService'
import type { CoverLetterStorageService } from './coverLetterStorageService'
import { apiClient, ApiError, TimeoutError } from './apiClient'
import { StorageError } from './storageErrors'

// StorageError now lives in storageErrors.ts (shared with the localStorage
// backend); re-exported here so existing imports keep working.
export { StorageError, type StorageErrorReason } from './storageErrors'

/**
 * Map transport-layer errors to storage-domain reasons.
 *
 * Previously this did `err.message.includes('HTTP 404')`, but the backend
 * returns a typed error envelope (`{ success: false, error: { code, message } }`)
 * and apiClient now surfaces the human `message` rather than a synthetic
 * "HTTP 404" string — so the substring match silently failed and everything
 * got classified as `unknown`. We now discriminate on `ApiError.status`,
 * which is tamper-proof and language-agnostic.
 */
function classifyError(err: unknown): StorageError {
  if (err instanceof ApiError) {
    if (err.status === 404) return new StorageError('not_found', err.message)
    if (err.status === 401 || err.status === 403)
      return new StorageError('unauthorized', err.message)
    if (err.status === 429) return new StorageError('rate_limited', err.message, err.retryAfterMs)
    if (err.status === 413) return new StorageError('too_large', err.message)
    if (err.status === 422) return new StorageError('invalid', err.message)
    if (err.status >= 500) return new StorageError('network', err.message)
    return new StorageError('unknown', err.message)
  }
  if (err instanceof TimeoutError) return new StorageError('network', err.message)
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    // fetch() throws TypeError for DNS failures, CORS rejections, etc.
    return new StorageError('network', err.message)
  }
  if (err instanceof Error) return new StorageError('unknown', err.message)
  return new StorageError('unknown', 'An unexpected storage error occurred.')
}

// ─── API-backed CV storage ────────────────────────────────────────────────────
// Manages one CV per session (Phase 2). Phase 3 will add multi-CV selection UI.
// Uses first (most recently updated) CV returned by GET /cv.

export class ApiCVStorageService implements StorageService {
  private cvId: string | null = null

  // Single-flight guard for resolving the active CV id. Without it, a burst of
  // auto-saves that fire before `cvId` is cached each issued their own slim
  // GET /cv — and if those reads got 429'd, `cvId` never cached, so every
  // subsequent save re-requested it, pinning the read limiter in a
  // self-sustaining loop. Funnelling every caller through one shared promise
  // guarantees a single in-flight resolve at a time.
  private resolveInFlight: Promise<string | null> | null = null

  /** The id of the CV resolved by the most recent load() — used by the share panel. */
  getActiveId(): string | null {
    return this.cvId
  }

  /**
   * Resolve (and memoize) the id of the most-recently-edited CV with a single
   * slim GET /cv — no `content` JSONB. Returns the cached id without any
   * network call once known; deduplicates concurrent callers onto one request.
   * Returns null when the user has no CV yet.
   */
  private resolveCvId(): Promise<string | null> {
    if (this.cvId) return Promise.resolve(this.cvId)
    if (this.resolveInFlight) return this.resolveInFlight
    this.resolveInFlight = apiClient
      .get<{
        success: boolean
        data: Array<{ id: string; title: string; updatedAt: string }>
      }>('/cv')
      .then((list) => {
        this.cvId = list.data?.[0]?.id ?? null
        return this.cvId
      })
      .finally(() => {
        this.resolveInFlight = null
      })
    return this.resolveInFlight
  }

  async load(): Promise<CVData | null> {
    try {
      // Resolve the id with a single slim list read (or the cached id, free).
      // Then fetch the full document with a targeted GET so the dashboard
      // doesn't pay for every row's payload. A re-load with a cached id costs
      // one read (detail only) instead of two.
      const id = await this.resolveCvId()
      if (!id) return null
      const detail = await apiClient.get<{
        success: boolean
        data: { id: string; content: CVData }
      }>(`/cv/${id}`)
      return detail.data.content
    } catch (err) {
      const storageErr = classifyError(err)
      // not_found is normal (new user with no CV yet) — treat as null.
      if (storageErr.reason === 'not_found') return null
      console.error('[ApiCVStorageService] load failed:', storageErr)
      throw storageErr
    }
  }

  async save(data: CVData): Promise<void> {
    try {
      // Get-or-create: when we don't yet know our CV id, resolve an existing one
      // BEFORE deciding to POST. Without this, an auto-save that fires before the
      // initial load() has populated cvId would create a duplicate, near-empty
      // CV — which then shadows the user's real CV (load() returns the
      // most-recently-updated row), presenting as "data deleted after login".
      //
      // We resolve with a slim list read only (not a full load() — that pulled
      // the detail document too, costing 2 reads per save while cvId was
      // unknown). Once resolved, cvId is memoized and steady-state saves issue
      // ZERO reads — just the PUT.
      const id = await this.resolveCvId()
      if (id) {
        await apiClient.put(`/cv/${id}`, { content: data })
      } else {
        const res = await apiClient.post<{ success: boolean; data: { id: string } }>('/cv', {
          content: data,
        })
        this.cvId = res.data?.id ?? null
      }
    } catch (err) {
      const storageErr = classifyError(err)
      console.error('[ApiCVStorageService] save failed:', storageErr)
      throw storageErr
    }
  }

  async clear(): Promise<void> {
    if (!this.cvId) return
    try {
      await apiClient.delete(`/cv/${this.cvId}`)
      this.cvId = null
    } catch (err) {
      const storageErr = classifyError(err)
      console.error('[ApiCVStorageService] clear failed:', storageErr)
      throw storageErr
    }
  }
}

// ─── API-backed Cover Letter storage ─────────────────────────────────────────

export class ApiCoverLetterStorageService implements CoverLetterStorageService {
  async load(): Promise<CoverLetterData | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: CoverLetterData | null }>(
        '/cover-letter',
      )
      return res.data ?? null
    } catch (err) {
      const storageErr = classifyError(err)
      if (storageErr.reason === 'not_found') return null
      console.error('[ApiCoverLetterStorageService] load failed:', storageErr)
      throw storageErr
    }
  }

  async save(data: CoverLetterData): Promise<void> {
    try {
      await apiClient.put('/cover-letter', { content: data })
    } catch (err) {
      const storageErr = classifyError(err)
      console.error('[ApiCoverLetterStorageService] save failed:', storageErr)
      throw storageErr
    }
  }

  async clear(): Promise<void> {
    try {
      await apiClient.delete('/cover-letter')
    } catch (err) {
      const storageErr = classifyError(err)
      console.error('[ApiCoverLetterStorageService] clear failed:', storageErr)
      throw storageErr
    }
  }
}
