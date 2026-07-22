/**
 * Regression test for the "data deleted after login" bug.
 *
 * Root cause: on login a fresh ApiCVStorageService is created with cvId=null.
 * If an auto-save fired before the initial load() populated cvId, save() took
 * the POST branch and created a DUPLICATE, near-empty CV — which then shadowed
 * the user's real CV (load() returns the most-recently-updated row).
 *
 * The fix makes save() get-or-create: when cvId is unknown it loads first to
 * resolve an existing CV id and UPDATEs it instead of POSTing a new one.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
const del = vi.fn()

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
    delete: (...a: unknown[]) => del(...a),
  },
  ApiError: class ApiError extends Error {
    status: number
    code: string
    constructor(status: number, code: string, message: string) {
      super(message)
      this.status = status
      this.code = code
    }
  },
  TimeoutError: class TimeoutError extends Error {},
}))

import { ApiCVStorageService, StorageError } from './apiStorageService'
import { ApiError } from '@/services/apiClient'
import type { CVData } from '@/types/cv.types'

const fakeCV = { meta: { version: '1.4.0' } } as unknown as CVData

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  put.mockReset()
  del.mockReset()
})

describe('ApiCVStorageService.save (get-or-create)', () => {
  it('UPDATEs the existing CV instead of creating a duplicate when cvId is unknown', async () => {
    // GET /cv returns one existing CV, GET /cv/:id returns its content.
    get
      .mockResolvedValueOnce({ success: true, data: [{ id: 'cv-1', title: 'x', updatedAt: 'z' }] })
      .mockResolvedValueOnce({ success: true, data: { id: 'cv-1', content: fakeCV } })

    const svc = new ApiCVStorageService()
    await svc.save(fakeCV) // cvId starts null — must resolve via load(), then PUT

    expect(post).not.toHaveBeenCalled()
    expect(put).toHaveBeenCalledWith('/cv/cv-1', { content: fakeCV })
  })

  it('POSTs a new CV only when the user genuinely has none', async () => {
    get.mockResolvedValueOnce({ success: true, data: [] }) // empty list → no existing CV
    post.mockResolvedValueOnce({ success: true, data: { id: 'new-1' } })

    const svc = new ApiCVStorageService()
    await svc.save(fakeCV)

    expect(post).toHaveBeenCalledWith('/cv', { content: fakeCV })
  })

  it('resolves the CV id with a single slim list read — not a full detail fetch', async () => {
    // Regression for the read-amplification loop: save() used to call load(),
    // which issued GET /cv AND GET /cv/:id (2 reads) per save while cvId was
    // unknown. It must now resolve with the list only.
    get.mockResolvedValueOnce({ success: true, data: [{ id: 'cv-1', title: 'x', updatedAt: 'z' }] })

    const svc = new ApiCVStorageService()
    await svc.save(fakeCV)

    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/cv')
    expect(put).toHaveBeenCalledWith('/cv/cv-1', { content: fakeCV })
  })

  it('memoizes the resolved id so steady-state saves issue ZERO reads', async () => {
    get.mockResolvedValueOnce({ success: true, data: [{ id: 'cv-1', title: 'x', updatedAt: 'z' }] })

    const svc = new ApiCVStorageService()
    await svc.save(fakeCV) // first save resolves + caches cv-1
    await svc.save(fakeCV) // second save must reuse the cached id
    await svc.save(fakeCV)

    expect(get).toHaveBeenCalledTimes(1) // only the first save read the list
    expect(put).toHaveBeenCalledTimes(3)
    expect(put).toHaveBeenLastCalledWith('/cv/cv-1', { content: fakeCV })
  })

  it('classifies HTTP 413 as StorageError(too_large)', async () => {
    get.mockResolvedValueOnce({ success: true, data: [{ id: 'cv-1', title: 'x', updatedAt: 'z' }] })
    put.mockRejectedValueOnce(
      new (ApiError as unknown as new (s: number, c: string, m: string) => Error)(
        413,
        'PAYLOAD_TOO_LARGE',
        'Request body exceeds the maximum allowed size.',
      ),
    )

    const svc = new ApiCVStorageService()
    await expect(svc.save(fakeCV)).rejects.toSatisfy(
      (err: unknown) => err instanceof StorageError && err.reason === 'too_large',
    )
  })

  it('classifies HTTP 422 as StorageError(invalid)', async () => {
    get.mockResolvedValueOnce({ success: true, data: [{ id: 'cv-1', title: 'x', updatedAt: 'z' }] })
    put.mockRejectedValueOnce(
      new (ApiError as unknown as new (s: number, c: string, m: string) => Error)(
        422,
        'VALIDATION_ERROR',
        'Validation failed',
      ),
    )

    const svc = new ApiCVStorageService()
    await expect(svc.save(fakeCV)).rejects.toSatisfy(
      (err: unknown) => err instanceof StorageError && err.reason === 'invalid',
    )
  })

  it('single-flights concurrent save id resolution onto one GET /cv', async () => {
    let resolveList: (v: unknown) => void = () => {}
    get.mockReturnValueOnce(
      new Promise((res) => {
        resolveList = res
      }),
    )

    const svc = new ApiCVStorageService()
    // Two saves fired before the list request settles must SHARE one GET /cv.
    const p1 = svc.save(fakeCV)
    const p2 = svc.save(fakeCV)
    resolveList({ success: true, data: [{ id: 'cv-1', title: 'x', updatedAt: 'z' }] })
    await Promise.all([p1, p2])

    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/cv')
    expect(put).toHaveBeenCalledTimes(2)
    expect(put).toHaveBeenLastCalledWith('/cv/cv-1', { content: fakeCV })
  })
})

describe('ApiCVStorageService.load (single round-trip)', () => {
  it('fetches the latest CV with content in ONE GET /cv/latest', async () => {
    get.mockResolvedValueOnce({ success: true, data: { id: 'cv-1', content: fakeCV } })

    const svc = new ApiCVStorageService()
    const result = await svc.load()

    expect(result).toBe(fakeCV)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/cv/latest')

    // The id is memoized, so a subsequent save reuses it with ZERO extra reads.
    await svc.save(fakeCV)
    expect(get).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith('/cv/cv-1', { content: fakeCV })
  })

  it('returns null when the user has no CV yet', async () => {
    get.mockResolvedValueOnce({ success: true, data: null })
    const svc = new ApiCVStorageService()
    expect(await svc.load()).toBeNull()
    expect(get).toHaveBeenCalledWith('/cv/latest')
  })
})
