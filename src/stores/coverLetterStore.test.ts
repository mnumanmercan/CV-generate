/**
 * Regression tests for the cover-letter store's load-time migration — added
 * with the letter's first schema change (1.0.0 → 1.1.0, targetJobDescription).
 * A stored blob from before the field existed must load with the field
 * backfilled, or every deep-watch save and AI analysis would see `undefined`.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCoverLetterStore } from './coverLetterStore'
import {
  coverLetterStorageService,
  type CoverLetterStorageService,
} from '@/services/coverLetterStorageService'
import {
  createEmptyCoverLetterData,
  COVER_LETTER_CURRENT_VERSION,
  type CoverLetterData,
} from '@/types/coverLetter.types'

function makeStorage(stored: CoverLetterData | null): CoverLetterStorageService {
  return {
    async save() {},
    async load() {
      return stored
    },
    async clear() {},
  }
}

// A v1.0.0 blob captured before targetJobDescription existed.
function legacyBlob(): CoverLetterData {
  const data = createEmptyCoverLetterData()
  data.fullName = 'Jane Doe'
  data.opening = 'An opening paragraph.'
  data.meta.version = '1.0.0'
  // Simulate the pre-1.1.0 shape: the key is absent entirely.
  delete (data as Partial<CoverLetterData>).targetJobDescription
  return data
}

describe('coverLetterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates empty data with targetJobDescription and the current version', () => {
    const data = createEmptyCoverLetterData()
    expect(data.targetJobDescription).toBe('')
    expect(data.meta.version).toBe(COVER_LETTER_CURRENT_VERSION)
  })

  it('backfills targetJobDescription and stamps the version when loading a v1.0.0 blob', async () => {
    coverLetterStorageService.setDelegate(makeStorage(legacyBlob()))
    const store = useCoverLetterStore()

    await store.loadFromStorage()

    expect(store.clData.targetJobDescription).toBe('')
    expect(store.clData.meta.version).toBe(COVER_LETTER_CURRENT_VERSION)
    // Migration must not clobber real content.
    expect(store.clData.fullName).toBe('Jane Doe')
    expect(store.clData.opening).toBe('An opening paragraph.')
  })

  it('leaves a current-version blob untouched', async () => {
    const current = createEmptyCoverLetterData()
    current.targetJobDescription = 'A pasted job posting.'
    coverLetterStorageService.setDelegate(makeStorage(current))
    const store = useCoverLetterStore()

    await store.loadFromStorage()

    expect(store.clData.targetJobDescription).toBe('A pasted job posting.')
    expect(store.clData.meta.version).toBe(COVER_LETTER_CURRENT_VERSION)
  })
})
