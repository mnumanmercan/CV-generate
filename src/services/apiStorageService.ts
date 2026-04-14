import type { CVData } from '@/types/cv.types'
import type { CoverLetterData } from '@/types/coverLetter.types'
import type { StorageService } from './storageService'
import type { CoverLetterStorageService } from './coverLetterStorageService'
import { apiClient } from './apiClient'

// ─── API-backed CV storage ────────────────────────────────────────────────────
// Manages one CV per session (Phase 2). Phase 3 will add multi-CV selection UI.
// Uses first (most recently updated) CV returned by GET /cv.

export class ApiCVStorageService implements StorageService {
  private cvId: string | null = null

  async load(): Promise<CVData | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: Array<{ id: string; content: CVData }> }>('/cv')
      if (!res.data?.length) return null
      this.cvId = res.data[0]!.id
      return res.data[0]!.content
    } catch (err) {
      console.error('[ApiCVStorageService] load failed:', err)
      return null
    }
  }

  async save(data: CVData): Promise<void> {
    try {
      if (this.cvId) {
        await apiClient.put(`/cv/${this.cvId}`, { content: data })
      } else {
        const res = await apiClient.post<{ success: boolean; data: { id: string } }>('/cv', { content: data })
        this.cvId = res.data.id
      }
    } catch (err) {
      console.error('[ApiCVStorageService] save failed:', err)
    }
  }

  async clear(): Promise<void> {
    if (!this.cvId) return
    try {
      await apiClient.delete(`/cv/${this.cvId}`)
      this.cvId = null
    } catch (err) {
      console.error('[ApiCVStorageService] clear failed:', err)
    }
  }
}

// ─── API-backed Cover Letter storage ─────────────────────────────────────────

export class ApiCoverLetterStorageService implements CoverLetterStorageService {
  async load(): Promise<CoverLetterData | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: CoverLetterData | null }>('/cover-letter')
      return res.data
    } catch (err) {
      console.error('[ApiCoverLetterStorageService] load failed:', err)
      return null
    }
  }

  async save(data: CoverLetterData): Promise<void> {
    try {
      await apiClient.put('/cover-letter', { content: data })
    } catch (err) {
      console.error('[ApiCoverLetterStorageService] save failed:', err)
    }
  }

  async clear(): Promise<void> {
    try {
      await apiClient.delete('/cover-letter')
    } catch (err) {
      console.error('[ApiCoverLetterStorageService] clear failed:', err)
    }
  }
}
