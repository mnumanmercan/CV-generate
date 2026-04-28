import type { CVData } from '@/types/cv.types'
import type { CoverLetterData } from '@/types/coverLetter.types'
import type { StorageService } from './storageService'
import type { CoverLetterStorageService } from './coverLetterStorageService'
import { apiClient, ApiError, TimeoutError } from './apiClient'

// ─── Typed storage error ──────────────────────────────────────────────────────
// Callers can distinguish between error types to show appropriate UI feedback.

export type StorageErrorReason = 'not_found' | 'unauthorized' | 'network' | 'unknown'

export class StorageError extends Error {
  // Plain field instead of the constructor-parameter shorthand because the
  // app tsconfig enables `erasableSyntaxOnly` (which forbids emitted runtime
  // assignments from parameter properties).
  readonly reason: StorageErrorReason

  constructor(reason: StorageErrorReason, message: string) {
    super(message)
    this.reason = reason
    this.name   = 'StorageError'
  }
}

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

  async load(): Promise<CVData | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: Array<{ id: string; content: CVData }> }>('/cv')
      const first = res.data?.[0]
      if (!first) return null
      this.cvId = first.id
      return first.content
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
      if (this.cvId) {
        await apiClient.put(`/cv/${this.cvId}`, { content: data })
      } else {
        const res = await apiClient.post<{ success: boolean; data: { id: string } }>('/cv', { content: data })
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
      const res = await apiClient.get<{ success: boolean; data: CoverLetterData | null }>('/cover-letter')
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
