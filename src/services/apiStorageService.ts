import type { CVData } from '@/types/cv.types'
import type { CoverLetterData } from '@/types/coverLetter.types'
import type { StorageService } from './storageService'
import type { CoverLetterStorageService } from './coverLetterStorageService'
import { apiClient } from './apiClient'

// ─── Typed storage error ──────────────────────────────────────────────────────
// Callers can distinguish between error types to show appropriate UI feedback.

export type StorageErrorReason = 'not_found' | 'unauthorized' | 'network' | 'unknown'

export class StorageError extends Error {
  constructor(
    public readonly reason: StorageErrorReason,
    message: string,
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

function classifyError(err: unknown): StorageError {
  if (err instanceof Error) {
    if (err.message.includes('HTTP 404')) return new StorageError('not_found', err.message)
    if (err.message.includes('HTTP 401') || err.message.includes('HTTP 403'))
      return new StorageError('unauthorized', err.message)
    if (err.message.includes('timed out') || err.message.includes('fetch'))
      return new StorageError('network', err.message)
    return new StorageError('unknown', err.message)
  }
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
