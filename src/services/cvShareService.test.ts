import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

// Mock the transport so the share service is tested in isolation.
const apiClient = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}
vi.mock('./apiClient', () => ({ apiClient }))

const {
  resolveActiveCvId,
  getShareStatus,
  createShareLink,
  regenerateShareLink,
  removeShareLink,
  fetchPublicCV,
  buildShareUrl,
} = await import('./cvShareService')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('cvShareService', () => {
  it('resolveActiveCvId returns the first CV id, or null when none', async () => {
    apiClient.get.mockResolvedValueOnce({ success: true, data: [{ id: 'cv-9', updatedAt: 'x' }] })
    expect(await resolveActiveCvId()).toBe('cv-9')

    apiClient.get.mockResolvedValueOnce({ success: true, data: [] })
    expect(await resolveActiveCvId()).toBeNull()
  })

  it('getShareStatus hits the share endpoint and returns slug state', async () => {
    apiClient.get.mockResolvedValueOnce({ success: true, data: { slug: null } })
    expect(await getShareStatus('cv-1')).toEqual({ slug: null })
    expect(apiClient.get).toHaveBeenCalledWith('/cv/cv-1/share')
  })

  it('createShareLink posts to the share endpoint', async () => {
    apiClient.post.mockResolvedValueOnce({ success: true, data: { slug: 'abc' } })
    expect(await createShareLink('cv-1')).toEqual({ slug: 'abc' })
    expect(apiClient.post).toHaveBeenCalledWith('/cv/cv-1/share')
  })

  it('regenerateShareLink posts to the regenerate endpoint', async () => {
    apiClient.post.mockResolvedValueOnce({ success: true, data: { slug: 'xyz' } })
    expect(await regenerateShareLink('cv-1')).toEqual({ slug: 'xyz' })
    expect(apiClient.post).toHaveBeenCalledWith('/cv/cv-1/share/regenerate')
  })

  it('removeShareLink deletes the share endpoint', async () => {
    apiClient.delete.mockResolvedValueOnce(undefined)
    await removeShareLink('cv-1')
    expect(apiClient.delete).toHaveBeenCalledWith('/cv/cv-1/share')
  })

  it('fetchPublicCV hits the public endpoint with an encoded slug', async () => {
    const payload = { title: 'T', content: { personal: { fullName: 'A' } } }
    apiClient.get.mockResolvedValueOnce({ success: true, data: payload })
    expect(await fetchPublicCV('a/b+c')).toEqual(payload)
    expect(apiClient.get).toHaveBeenCalledWith('/public/cv/a%2Fb%2Bc')
  })
})

describe('buildShareUrl', () => {
  const original = window.location
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://resumark.app' },
      writable: true,
    })
  })
  afterEach(() => {
    Object.defineProperty(window, 'location', { value: original, writable: true })
  })

  it('builds an absolute /p/:slug URL from the current origin', () => {
    expect(buildShareUrl('slug123')).toBe('https://resumark.app/p/slug123')
  })
})
