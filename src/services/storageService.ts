import type { CVData } from '@/types/cv.types'
import { StorageError } from './storageErrors'

// ─── Abstraction interface ───────────────────────────────────────────────────
// Phase 2: swap LocalStorageService for MongoDBService without touching
// any component or store code.

/** Slim CV descriptor — what the variant tab strip and dashboard list need. */
export interface CVSummary {
  id: string
  title: string
  updatedAt: string
}

export interface StorageService {
  save(data: CVData): Promise<void>
  load(): Promise<CVData | null>
  clear(): Promise<void>
  /**
   * The active server-side CV id, when the backend is API-backed. Returns null
   * for local/guest storage, or before the first successful load. Lets callers
   * (e.g. the share panel) reuse the id `load()` already resolved instead of
   * issuing a second list request.
   */
  getActiveId?(): string | null

  // ─── Multi-document (CV variants) ──────────────────────────────────────────
  // Optional on purpose: only the API backend can hold more than one CV, so
  // LocalStorageService (guests — one fixed key) implements none of these and
  // needs no changes. Callers gate on `supportsMultiple` rather than probing
  // for individual methods.

  /** True when this backend can hold more than one CV. */
  supportsMultiple?: boolean
  list?(): Promise<CVSummary[]>
  loadById?(id: string): Promise<CVData | null>
  saveById?(id: string, data: CVData, title?: string): Promise<void>
  create?(data: CVData, title: string): Promise<CVSummary>
  rename?(id: string, title: string): Promise<void>
  remove?(id: string): Promise<void>
  /** Point subsequent save()/load() calls at a specific CV row. */
  setActiveId?(id: string): void
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
      // Throw instead of silently returning — the caller (cvStore) surfaces
      // the "not saved" state to the user; swallowing it here meant guests in
      // private-browsing mode believed their edits were persisting.
      throw new StorageError('unavailable', 'localStorage is unavailable — data will not persist.')
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      // isAvailable()'s tiny probe passes even when the real payload no longer
      // fits, so quota errors surface here.
      if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
        throw new StorageError('quota_exceeded', 'Browser storage is full — CV was not saved.')
      }
      throw new StorageError(
        'unknown',
        err instanceof Error ? err.message : 'Failed to save CV data to localStorage.',
      )
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

/**
 * Synchronous localStorage read for the initial store value.
 *
 * `localStorage.getItem` is synchronous, so the store can hydrate its first
 * value from the last-saved CV *before first paint* — returning visitors (and
 * every guest) see their real data immediately instead of the empty default
 * that flashes while the async `load()` round-trip is still in flight.
 *
 * Returns the raw parsed blob (unmigrated — the caller runs `migrateCVData`)
 * or null when storage is empty, unavailable (private mode), or corrupt. Never
 * throws: a bad read must not brick app boot.
 */
export function readLocalCVSync(): CVData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CVData
  } catch {
    return null
  }
}

// ─── Delegating proxy ────────────────────────────────────────────────────────
// Wraps the active implementation so that cvStore.ts requires zero changes.
// Call setDelegate(new ApiCVStorageService()) on login to switch to cloud sync.
// Call setDelegate(new LocalStorageService()) on logout to revert to local.
export class DelegatingStorageService implements StorageService {
  private _impl: StorageService = new LocalStorageService()

  setDelegate(impl: StorageService): void {
    this._impl = impl
  }

  async save(data: CVData): Promise<void> {
    return this._impl.save(data)
  }
  async load(): Promise<CVData | null> {
    return this._impl.load()
  }
  async clear(): Promise<void> {
    return this._impl.clear()
  }
  getActiveId(): string | null {
    return this._impl.getActiveId?.() ?? null
  }

  // ─── Multi-document passthrough ────────────────────────────────────────────
  // The local backend implements none of these. Rather than returning silent
  // no-ops (which would present as "the variant saved" when nothing happened),
  // the mutating methods throw — callers must check `supportsMultiple` first,
  // and the variant UI is Pro-gated so they never reach here for a guest.

  get supportsMultiple(): boolean {
    return this._impl.supportsMultiple ?? false
  }

  private requireMulti<T>(fn: T | undefined, name: string): T {
    if (!fn) {
      throw new StorageError(
        'unauthorized',
        `This storage backend holds a single CV — ${name}() needs a signed-in account.`,
      )
    }
    return fn
  }

  async list(): Promise<CVSummary[]> {
    // Read-only, so a single-CV backend can answer honestly with an empty list
    // instead of throwing — the tab strip then simply renders one tab.
    if (!this._impl.list) return []
    return this._impl.list()
  }
  async loadById(id: string): Promise<CVData | null> {
    return this.requireMulti(this._impl.loadById, 'loadById').call(this._impl, id)
  }
  async saveById(id: string, data: CVData, title?: string): Promise<void> {
    return this.requireMulti(this._impl.saveById, 'saveById').call(this._impl, id, data, title)
  }
  async create(data: CVData, title: string): Promise<CVSummary> {
    return this.requireMulti(this._impl.create, 'create').call(this._impl, data, title)
  }
  async rename(id: string, title: string): Promise<void> {
    return this.requireMulti(this._impl.rename, 'rename').call(this._impl, id, title)
  }
  async remove(id: string): Promise<void> {
    return this.requireMulti(this._impl.remove, 'remove').call(this._impl, id)
  }
  setActiveId(id: string): void {
    this._impl.setActiveId?.(id)
  }
}

export { LocalStorageService }
export const localStorageService = new DelegatingStorageService()
