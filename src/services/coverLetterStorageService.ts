import type { CoverLetterData } from '@/types/coverLetter.types'

export interface CoverLetterStorageService {
  save(data: CoverLetterData): Promise<void>
  load(): Promise<CoverLetterData | null>
  clear(): Promise<void>
}

const STORAGE_KEY = 'cover_letter_data'

class LocalCoverLetterStorageService implements CoverLetterStorageService {
  private isAvailable(): boolean {
    try {
      const testKey = '__cl_test__'
      localStorage.setItem(testKey, '1')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  async save(data: CoverLetterData): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('localStorage is unavailable — cover letter data will not persist.')
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('Failed to save cover letter data to localStorage:', err)
    }
  }

  async load(): Promise<CoverLetterData | null> {
    if (!this.isAvailable()) return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as CoverLetterData
    } catch (err) {
      console.error('Failed to load cover letter data from localStorage:', err)
      return null
    }
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) return
    localStorage.removeItem(STORAGE_KEY)
  }
}

// ─── Delegating proxy ────────────────────────────────────────────────────────
// Same pattern as DelegatingStorageService — coverLetterStore.ts requires zero changes.
export class DelegatingCoverLetterStorageService implements CoverLetterStorageService {
  private _impl: CoverLetterStorageService = new LocalCoverLetterStorageService()

  setDelegate(impl: CoverLetterStorageService): void {
    this._impl = impl
  }

  async save(data: CoverLetterData): Promise<void>   { return this._impl.save(data) }
  async load(): Promise<CoverLetterData | null>       { return this._impl.load() }
  async clear(): Promise<void>                        { return this._impl.clear() }
}

export { LocalCoverLetterStorageService }
export const coverLetterStorageService = new DelegatingCoverLetterStorageService()
