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

/**
 * Synchronous localStorage read for the store's initial value — the cover-letter
 * counterpart of `readLocalCVSync`. Lets the preview render the last-saved letter
 * on first paint instead of flashing the empty default while the async `load()`
 * (localStorage, or a cloud round-trip when logged in) is still in flight.
 *
 * Returns the raw parsed blob (unmigrated — the caller runs
 * `migrateCoverLetterData`) or null when storage is empty, unavailable, or
 * corrupt. Never throws: a bad read must not brick app boot.
 */
export function readLocalCoverLetterSync(): CoverLetterData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CoverLetterData
  } catch {
    return null
  }
}

// ─── Delegating proxy ────────────────────────────────────────────────────────
// Same pattern as DelegatingStorageService — coverLetterStore.ts requires zero changes.
export class DelegatingCoverLetterStorageService implements CoverLetterStorageService {
  private _impl: CoverLetterStorageService = new LocalCoverLetterStorageService()

  setDelegate(impl: CoverLetterStorageService): void {
    this._impl = impl
  }

  async save(data: CoverLetterData): Promise<void> {
    return this._impl.save(data)
  }
  async load(): Promise<CoverLetterData | null> {
    return this._impl.load()
  }
  async clear(): Promise<void> {
    return this._impl.clear()
  }
}

export { LocalCoverLetterStorageService }
export const coverLetterStorageService = new DelegatingCoverLetterStorageService()
