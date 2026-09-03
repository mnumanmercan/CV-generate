import type { CVData } from '@/types/cv.types'
import type { CoverLetterData } from '@/types/coverLetter.types'
import type { StorageService, CVSummary } from './storageService'
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
    // 402 PLAN_LIMIT_EXCEEDED — the CV cap is reached. Surfaced by createVariant
    // as the upgrade modal rather than as a save failure.
    if (err.status === 402) return new StorageError('plan_limit', err.message)
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

/**
 * Fallback title for a row the user hasn't named. Uses `||` (not `??`) because
 * an unnamed CV's `fullName` is an empty string, not undefined — auto-save
 * fires on a near-empty CV within 500 ms of the first keystroke, and an empty
 * title renders as a blank variant tab.
 */
function defaultTitleFor(data: CVData): string {
  // Optional-chained through `personal` as well: this runs on the save path,
  // and a malformed blob must degrade to a default title, never throw a
  // spurious save failure.
  return data.personal?.fullName?.trim() || 'My CV'
}

// ─── API-backed CV storage ────────────────────────────────────────────────────
// Multi-document. `cvId` is the ACTIVE CV — the one save()/load() operate on.
// It is resolved lazily (most-recently-updated) for a cold load, and set
// explicitly by cvStore.switchVariant() once the user picks a tab. The
// id-addressed methods below (loadById/saveById/create/rename/remove) let the
// store hold several variants at once without disturbing the active one.

export class ApiCVStorageService implements StorageService {
  private cvId: string | null = null

  readonly supportsMultiple = true

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
   * Point save()/load() at a specific CV. Called by cvStore.switchVariant()
   * so the active tab — not merely the most-recently-updated row — is what
   * auto-save writes to.
   */
  setActiveId(id: string): void {
    this.cvId = id
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
      // ONE round-trip: the most-recently-updated CV with its content. Replaces
      // the old slim GET /cv (resolve id) + GET /cv/:id (content) pair. Memoize
      // the resolved id so subsequent saves reuse it (get-or-create in save(),
      // and the share panel via getActiveId()) without a second lookup.
      const res = await apiClient.get<{
        success: boolean
        data: { id: string; content: CVData } | null
      }>('/cv/latest')
      if (!res.data) return null
      this.cvId = res.data.id
      return res.data.content
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
        // Deliberately NO title on the update path: the row already has the
        // name the user gave it in the variant tab strip, and re-sending a
        // fullName-derived title on every auto-save would silently rename
        // "Acme · Backend" back to the person's own name.
        await apiClient.put(`/cv/${id}`, { content: data })
      } else {
        const res = await apiClient.post<{ success: boolean; data: { id: string } }>('/cv', {
          content: data,
          title: defaultTitleFor(data),
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

  // ─── Multi-document (CV variants) ──────────────────────────────────────────
  // Every method here is id-addressed and leaves `cvId` alone (except create,
  // which does not switch either — cvStore.switchVariant owns that decision).

  async list(): Promise<CVSummary[]> {
    try {
      const res = await apiClient.get<{ success: boolean; data: CVSummary[] }>('/cv')
      return res.data ?? []
    } catch (err) {
      const storageErr = classifyError(err)
      console.error('[ApiCVStorageService] list failed:', storageErr)
      throw storageErr
    }
  }

  async loadById(id: string): Promise<CVData | null> {
    try {
      const res = await apiClient.get<{
        success: boolean
        data: { id: string; content: CVData } | null
      }>(`/cv/${id}`)
      return res.data?.content ?? null
    } catch (err) {
      const storageErr = classifyError(err)
      if (storageErr.reason === 'not_found') return null
      console.error('[ApiCVStorageService] loadById failed:', storageErr)
      throw storageErr
    }
  }

  async saveById(id: string, data: CVData, title?: string): Promise<void> {
    try {
      await apiClient.put(`/cv/${id}`, {
        content: data,
        ...(title !== undefined ? { title } : {}),
      })
    } catch (err) {
      const storageErr = classifyError(err)
      console.error('[ApiCVStorageService] saveById failed:', storageErr)
      throw storageErr
    }
  }

  async create(data: CVData, title: string): Promise<CVSummary> {
    try {
      const res = await apiClient.post<{ success: boolean; data: CVSummary }>('/cv', {
        content: data,
        title: title || defaultTitleFor(data),
      })
      return res.data
    } catch (err) {
      const storageErr = classifyError(err)
      // plan_limit (402) is expected when the cap is reached — the caller turns
      // it into an upgrade prompt, so don't log it as a failure.
      if (storageErr.reason !== 'plan_limit') {
        console.error('[ApiCVStorageService] create failed:', storageErr)
      }
      throw storageErr
    }
  }

  async rename(id: string, title: string): Promise<void> {
    try {
      await apiClient.patch(`/cv/${id}`, { title })
    } catch (err) {
      const storageErr = classifyError(err)
      console.error('[ApiCVStorageService] rename failed:', storageErr)
      throw storageErr
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/cv/${id}`)
      // Only clear the active pointer if we just deleted the active row.
      if (this.cvId === id) this.cvId = null
    } catch (err) {
      const storageErr = classifyError(err)
      console.error('[ApiCVStorageService] remove failed:', storageErr)
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
