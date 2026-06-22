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

import { ApiCVStorageService } from './apiStorageService'
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
})
