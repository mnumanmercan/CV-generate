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
const patch = vi.fn()

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
    delete: (...a: unknown[]) => del(...a),
    patch: (...a: unknown[]) => patch(...a),
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
  patch.mockReset()
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

    // A title is sent on create so the row never lands with the empty title
    // the server's `??` fallback used to produce — variant tabs render it.
    expect(post).toHaveBeenCalledWith('/cv', { content: fakeCV, title: 'My CV' })
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

// ─── Multi-document (CV variants) ─────────────────────────────────────────────

describe('ApiCVStorageService — variants', () => {
  it('declares multi-document support so the store can gate on it', () => {
    expect(new ApiCVStorageService().supportsMultiple).toBe(true)
  })

  it('lists every CV, not just the most recent one', async () => {
    // The old resolveCvId() took data[0] and discarded the rest — that
    // narrowing is exactly what the tab strip needed removed.
    get.mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'cv-1', title: 'Acme', updatedAt: 'z' },
        { id: 'cv-2', title: 'Startup', updatedAt: 'y' },
        { id: 'cv-3', title: 'Bank', updatedAt: 'x' },
      ],
    })

    const svc = new ApiCVStorageService()
    await expect(svc.list()).resolves.toHaveLength(3)
    expect(get).toHaveBeenCalledWith('/cv')
  })

  it('loads a specific CV by id', async () => {
    get.mockResolvedValueOnce({ success: true, data: { id: 'cv-2', content: fakeCV } })

    const svc = new ApiCVStorageService()
    await expect(svc.loadById('cv-2')).resolves.toEqual(fakeCV)
    expect(get).toHaveBeenCalledWith('/cv/cv-2')
  })

  it('treats a 404 from loadById as null rather than an error', async () => {
    get.mockRejectedValueOnce(new ApiError(404, 'NOT_FOUND', 'CV not found.'))

    const svc = new ApiCVStorageService()
    await expect(svc.loadById('gone')).resolves.toBeNull()
  })

  it('saveById targets the given row and leaves the active pointer alone', async () => {
    put.mockResolvedValueOnce({ success: true })
    const svc = new ApiCVStorageService()
    svc.setActiveId('cv-1')

    await svc.saveById('cv-2', fakeCV)

    expect(put).toHaveBeenCalledWith('/cv/cv-2', { content: fakeCV })
    expect(svc.getActiveId()).toBe('cv-1')
  })

  it('saveById only sends a title when one was passed', async () => {
    put.mockResolvedValue({ success: true })
    const svc = new ApiCVStorageService()

    await svc.saveById('cv-2', fakeCV)
    expect(put).toHaveBeenLastCalledWith('/cv/cv-2', { content: fakeCV })

    await svc.saveById('cv-2', fakeCV, 'Renamed')
    expect(put).toHaveBeenLastCalledWith('/cv/cv-2', { content: fakeCV, title: 'Renamed' })
  })

  it('never re-sends a title on the ordinary save path', async () => {
    // Auto-save must not rename "Acme — Backend" back to the person's own name.
    get.mockResolvedValueOnce({ success: true, data: [{ id: 'cv-1', title: 'x', updatedAt: 'z' }] })
    put.mockResolvedValueOnce({ success: true })

    const svc = new ApiCVStorageService()
    await svc.save(fakeCV)

    expect(put).toHaveBeenCalledWith('/cv/cv-1', { content: fakeCV })
  })

  it('creates a CV with the given title', async () => {
    post.mockResolvedValueOnce({
      success: true,
      data: { id: 'cv-9', title: 'Acme — Backend', updatedAt: 'now' },
    })

    const svc = new ApiCVStorageService()
    const created = await svc.create(fakeCV, 'Acme — Backend')

    expect(post).toHaveBeenCalledWith('/cv', { content: fakeCV, title: 'Acme — Backend' })
    expect(created.id).toBe('cv-9')
  })

  it('maps a 402 to plan_limit so the caller can show the upgrade prompt', async () => {
    post.mockRejectedValueOnce(
      new ApiError(402, 'PLAN_LIMIT_EXCEEDED', 'Free plan allows a maximum of 1 CV.'),
    )

    const svc = new ApiCVStorageService()
    await expect(svc.create(fakeCV, 'Sixth')).rejects.toMatchObject({ reason: 'plan_limit' })
  })

  it('renames through PATCH — the endpoint that already existed but was never called', async () => {
    patch.mockResolvedValueOnce({ success: true })

    const svc = new ApiCVStorageService()
    await svc.rename('cv-2', 'Bank — Data')

    expect(patch).toHaveBeenCalledWith('/cv/cv-2', { title: 'Bank — Data' })
  })

  it('clears the active pointer only when the active row is the one removed', async () => {
    del.mockResolvedValue({ success: true })
    const svc = new ApiCVStorageService()
    svc.setActiveId('cv-1')

    await svc.remove('cv-2')
    expect(svc.getActiveId()).toBe('cv-1')

    await svc.remove('cv-1')
    expect(svc.getActiveId()).toBeNull()
  })

  it('setActiveId redirects subsequent saves without a list lookup', async () => {
    put.mockResolvedValueOnce({ success: true })
    const svc = new ApiCVStorageService()
    svc.setActiveId('cv-7')

    await svc.save(fakeCV)

    expect(get).not.toHaveBeenCalled()
    expect(put).toHaveBeenCalledWith('/cv/cv-7', { content: fakeCV })
  })
})

describe('StorageError export surface', () => {
  it('exposes plan_limit as a terminal reason', async () => {
    const { isTerminalReason } = await import('./storageErrors')
    expect(isTerminalReason('plan_limit')).toBe(true)
    expect(StorageError).toBeDefined()
  })
})
