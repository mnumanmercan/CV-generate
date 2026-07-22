/**
 * Unit tests for the CV share methods. These guard the privacy-critical
 * guarantees of the public share link:
 *
 *   1. Owner isolation — a non-owner cannot read or mutate share state (404).
 *   2. `share()` is idempotent; `regenerateShare()` mints a fresh slug.
 *   3. `unshare()` clears the slug.
 *   4. `getPublicBySlug()` returns ONLY title + content (no owner identity)
 *      and 404s on an unknown / turned-off slug.
 *
 * Prisma is mocked with an in-memory CV table. crypto is real.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
})

interface CVRow {
  id: string
  userId: string
  title: string
  content: unknown
  shareSlug: string | null
  createdAt: Date
  updatedAt: Date
}

const db = { cvs: new Map<string, CVRow>() }

const prismaMock = {
  cV: {
    findUnique: vi.fn(
      async ({ where }: { where: { id?: string; shareSlug?: string }; select?: unknown }) => {
        let row: CVRow | undefined
        if (where.id) row = db.cvs.get(where.id)
        else if (where.shareSlug !== undefined)
          row = [...db.cvs.values()].find((c) => c.shareSlug === where.shareSlug)
        return row ?? null
      },
    ),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<CVRow> }) => {
      const row = db.cvs.get(where.id)!
      Object.assign(row, data)
      return row
    }),
    findFirst: vi.fn(
      async ({
        where,
        orderBy,
      }: {
        where: { userId: string }
        orderBy?: { updatedAt: 'asc' | 'desc' }
      }) => {
        const rows = [...db.cvs.values()].filter((c) => c.userId === where.userId)
        rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        if (orderBy?.updatedAt === 'asc') rows.reverse()
        return rows[0] ?? null
      },
    ),
  },
}

vi.mock('../db/prisma.js', () => ({ prisma: prismaMock }))
vi.mock('../config/env.js', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>
  return { ...actual }
})

const { cvService } = await import('./cv.service.js')

const OWNER = 'owner-1'
const OTHER = 'other-2'

function seedCV(overrides: Partial<CVRow> = {}): CVRow {
  const id = `cv-${db.cvs.size + 1}`
  const row: CVRow = {
    id,
    userId: OWNER,
    title: 'My CV',
    content: { personal: { fullName: 'Ada Lovelace', email: 'ada@example.com' } },
    shareSlug: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
  db.cvs.set(id, row)
  return row
}

beforeEach(() => {
  db.cvs.clear()
  vi.clearAllMocks()
})

describe('cvService share', () => {
  it('share() mints a slug and is idempotent', async () => {
    const cv = seedCV()
    const first = await cvService.share(OWNER, cv.id)
    expect(first.slug).toBeTruthy()
    const second = await cvService.share(OWNER, cv.id)
    expect(second.slug).toBe(first.slug)
  })

  it('regenerateShare() replaces the slug', async () => {
    const cv = seedCV()
    const { slug: original } = await cvService.share(OWNER, cv.id)
    const { slug: fresh } = await cvService.regenerateShare(OWNER, cv.id)
    expect(fresh).not.toBe(original)
    // The old slug no longer resolves.
    await expect(cvService.getPublicBySlug(original)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('unshare() clears the slug', async () => {
    const cv = seedCV()
    const { slug } = await cvService.share(OWNER, cv.id)
    await cvService.unshare(OWNER, cv.id)
    expect(db.cvs.get(cv.id)!.shareSlug).toBeNull()
    await expect(cvService.getPublicBySlug(slug)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('getShareStatus() reflects current state', async () => {
    const cv = seedCV()
    expect((await cvService.getShareStatus(OWNER, cv.id)).slug).toBeNull()
    await cvService.share(OWNER, cv.id)
    expect((await cvService.getShareStatus(OWNER, cv.id)).slug).toBeTruthy()
  })

  it('rejects non-owners with 404 for every share method', async () => {
    const cv = seedCV()
    await expect(cvService.share(OTHER, cv.id)).rejects.toMatchObject({ statusCode: 404 })
    await expect(cvService.regenerateShare(OTHER, cv.id)).rejects.toMatchObject({ statusCode: 404 })
    await expect(cvService.unshare(OTHER, cv.id)).rejects.toMatchObject({ statusCode: 404 })
    await expect(cvService.getShareStatus(OTHER, cv.id)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('getPublicBySlug() returns only title + content, 404 on unknown slug', async () => {
    const cv = seedCV()
    const { slug } = await cvService.share(OWNER, cv.id)
    const pub = await cvService.getPublicBySlug(slug)
    expect(pub).toEqual({ title: cv.title, content: cv.content })
    expect(pub).not.toHaveProperty('userId')
    expect(pub).not.toHaveProperty('id')
    await expect(cvService.getPublicBySlug('does-not-exist')).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})

describe('cvService getLatest', () => {
  it('returns the most-recently-updated CV with its content', async () => {
    seedCV({ title: 'Older', updatedAt: new Date('2026-01-01') })
    const newer = seedCV({ title: 'Newer', updatedAt: new Date('2026-06-01') })
    const latest = await cvService.getLatest(OWNER)
    expect(latest?.id).toBe(newer.id)
    expect(latest?.content).toEqual(newer.content)
  })

  it('returns null when the user has no CV', async () => {
    expect(await cvService.getLatest(OWNER)).toBeNull()
  })

  it('never returns another user’s CV', async () => {
    seedCV({ userId: OTHER, title: 'Not mine' })
    expect(await cvService.getLatest(OWNER)).toBeNull()
  })
})
