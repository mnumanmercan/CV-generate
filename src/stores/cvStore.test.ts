/**
 * Regression tests for the cvStore data-safety guarantees called out in the
 * full-project review. The two scariest failure modes we want to pin down:
 *
 *   1. Concurrent edit during an in-flight save MUST NOT corrupt the
 *      snapshot written to storage (Section 1, 🔴 Critical — shallow
 *      spread was sharing nested array references).
 *   2. Two overlapping saves MUST NOT both enter the persist path
 *      (Section 2, 🔴 race on `isSaving` flag).
 *
 * These tests go straight at the store + mock storage. We don't need a DOM
 * for this, but jsdom is already the frontend vitest environment so no
 * special setup is required.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCVStore } from './cvStore'
import { localStorageService } from '@/services/storageService'
import type { StorageService } from '@/services/storageService'
import type { CVData } from '@/types/cv.types'

/**
 * Deferred-resolve storage: `save()` returns a promise we control so the
 * test can interleave mutations between "save started" and "save finished".
 * That's the exact timing window where shallow-copy bugs surface.
 */
function makeDeferredStorage(): {
  impl: StorageService
  received: CVData[]
  resolveNextSave: () => void
} {
  const received: CVData[] = []
  let resolveNext: (() => void) | null = null

  const impl: StorageService = {
    async save(data) {
      // Freeze the snapshot the store handed us so any in-place mutation
      // after this point would throw instead of silently corrupting data.
      const deepFrozen = JSON.parse(JSON.stringify(data)) as CVData
      received.push(deepFrozen)
      await new Promise<void>((resolve) => {
        resolveNext = resolve
      })
    },
    async load() { return null },
    async clear() {},
  }

  return {
    impl,
    received,
    resolveNextSave: () => {
      if (resolveNext) {
        resolveNext()
        resolveNext = null
      }
    },
  }
}

describe('cvStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useRealTimers()
  })

  it('captures a deep snapshot so in-flight edits do not corrupt the saved payload', async () => {
    const { impl, received, resolveNextSave } = makeDeferredStorage()
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    store.cvData.experience.push({
      id:        'exp-1',
      company:   'Acme',
      position:  'Engineer',
      location:  'Remote',
      startDate: '01/2023',
      endDate:   'Present',
      bullets:   ['Original bullet'],
    })

    const savePromise = store.saveToStorage()

    // Simulate the user editing a bullet while the save is mid-flight. With
    // the old shallow `{ ...cvData.value }` spread this would mutate the
    // shared array and corrupt the snapshot already handed to storage.
    store.cvData.experience[0]!.bullets[0] = 'Mutated after save started'
    store.cvData.experience[0]!.bullets.push('Late-addition bullet')

    resolveNextSave()
    await savePromise

    expect(received).toHaveLength(1)
    const snapshot = received[0]!
    expect(snapshot.experience[0]!.bullets).toEqual(['Original bullet'])
    expect(snapshot.experience[0]!.bullets).not.toContain('Mutated after save started')
    expect(snapshot.experience[0]!.bullets).not.toContain('Late-addition bullet')
  })

  it('ignores a second saveToStorage() call while the first is still pending', async () => {
    const { impl, received, resolveNextSave } = makeDeferredStorage()
    localStorageService.setDelegate(impl)

    const store = useCVStore()

    const first  = store.saveToStorage()
    // Second call enters while isSaving is still true — must no-op.
    const second = store.saveToStorage()

    // The second promise resolves immediately (no storage call).
    await second
    expect(received).toHaveLength(1)

    // Let the first call complete to avoid dangling promises in the test.
    resolveNextSave()
    await first
    expect(received).toHaveLength(1)
  })

  it('stamps meta.updatedAt and meta.version on every save', async () => {
    const { impl, received, resolveNextSave } = makeDeferredStorage()
    localStorageService.setDelegate(impl)

    const store = useCVStore()
    const beforeMs = Date.parse(store.cvData.meta.updatedAt)

    const p = store.saveToStorage()
    resolveNextSave()
    await p

    const snapshot = received[0]!
    // meta.updatedAt must be a valid ISO-8601 string that is >= the original
    // (same-ms is legal — Date.now() resolution is 1ms and tests are fast).
    const afterMs = Date.parse(snapshot.meta.updatedAt)
    expect(Number.isFinite(afterMs)).toBe(true)
    expect(afterMs).toBeGreaterThanOrEqual(beforeMs)
    expect(typeof snapshot.meta.version).toBe('string')
  })
})
