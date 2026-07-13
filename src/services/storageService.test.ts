/**
 * LocalStorageService failure surfacing. Historically quota errors and a
 * disabled localStorage were swallowed with a console log, so guests kept
 * editing while nothing persisted. save() must now throw a typed
 * StorageError the store can show to the user.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocalStorageService } from './storageService'
import { StorageError } from './storageErrors'
import type { CVData } from '@/types/cv.types'

const fakeCV = { meta: { version: '1.4.0' } } as unknown as CVData

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LocalStorageService.save', () => {
  it('throws StorageError(quota_exceeded) when the write hits the quota', async () => {
    // The isAvailable() probe writes a 1-byte test key and succeeds; only the
    // real payload write fails — exactly how quota exhaustion presents.
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    setItem.mockImplementation((key: string) => {
      if (key === '__cv_test__') return
      throw new DOMException('quota', 'QuotaExceededError')
    })

    const svc = new LocalStorageService()
    await expect(svc.save(fakeCV)).rejects.toSatisfy(
      (err: unknown) => err instanceof StorageError && err.reason === 'quota_exceeded',
    )
  })

  it('throws StorageError(unavailable) when localStorage is disabled entirely', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    const svc = new LocalStorageService()
    await expect(svc.save(fakeCV)).rejects.toSatisfy(
      (err: unknown) => err instanceof StorageError && err.reason === 'unavailable',
    )
  })

  it('resolves normally when the write succeeds', async () => {
    const svc = new LocalStorageService()
    await expect(svc.save(fakeCV)).resolves.toBeUndefined()
    expect(localStorage.getItem('cv_generate_data')).toContain('1.4.0')
    localStorage.removeItem('cv_generate_data')
  })
})
