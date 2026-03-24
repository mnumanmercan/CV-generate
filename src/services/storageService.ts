import type { CVData } from '@/types/cv.types'

// ─── Abstraction interface ───────────────────────────────────────────────────
// Phase 2: swap LocalStorageService for MongoDBService without touching
// any component or store code.
export interface StorageService {
  save(data: CVData): Promise<void>
  load(): Promise<CVData | null>
  clear(): Promise<void>
}

// ─── LocalStorage implementation ────────────────────────────────────────────
const STORAGE_KEY = 'cv_generate_data'

class LocalStorageService implements StorageService {
  private isAvailable(): boolean {
    try {
      const testKey = '__cv_test__'
      localStorage.setItem(testKey, '1')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  async save(data: CVData): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('localStorage is unavailable — data will not persist.')
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('Failed to save CV data to localStorage:', err)
    }
  }

  async load(): Promise<CVData | null> {
    if (!this.isAvailable()) return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as CVData
    } catch (err) {
      console.error('Failed to load CV data from localStorage:', err)
      return null
    }
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) return
    localStorage.removeItem(STORAGE_KEY)
  }
}

// ─── Exported singleton ──────────────────────────────────────────────────────
// To switch to MongoDB in Phase 2, replace this with MongoDBService instance.
export const localStorageService: StorageService = new LocalStorageService()
