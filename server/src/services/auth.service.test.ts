/**
 * Unit tests for the auth service. These focus on the two refresh-token
 * guarantees that, if broken, silently degrade security:
 *
 *   1. `refreshTokens()` rotates — the old refresh token is revoked and a
 *      new one issued in the same transaction. A replay of the old token
 *      must fail.
 *   2. `resetPassword()` revokes ALL outstanding refresh tokens for the
 *      user — otherwise a compromised session survives the reset.
 *
 * Prisma is mocked. bcrypt and crypto are real. The JWT signer is mocked
 * because we don't want to generate real RS256 tokens in tests (would
 * require loading a real key pair).
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  const dummyKey = Buffer.from('-----BEGIN DUMMY-----\nnope\n-----END DUMMY-----').toString('base64')
  process.env.JWT_PRIVATE_KEY_B64 = dummyKey
  process.env.JWT_PUBLIC_KEY_B64  = dummyKey
})

// ─── Mocks ─────────────────────────────────────────────────────────────────────

interface TokenRow {
  id:        string
  userId:    string
  tokenHash: string
  type:      'REFRESH' | 'EMAIL_VERIFY' | 'PASSWORD_RESET'
  expiresAt: Date
  revokedAt: Date | null
  user?:     { id: string; email: string; name: string; plan: string; passwordHash: string }
}

const db = {
  users: new Map<string, { id: string; email: string; name: string; plan: string; passwordHash: string; emailVerified: boolean }>(),
  tokens: [] as TokenRow[],
}

let nextId = 0
const genId = () => `id-${++nextId}`

const prismaMock = {
  user: {
    findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id)    return [...db.users.values()].find(u => u.id === where.id) ?? null
      if (where.email) return [...db.users.values()].find(u => u.email === where.email) ?? null
      return null
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const u = db.users.get(where.id)
      if (!u) throw new Error('not found')
      Object.assign(u, data)
      return u
    }),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const user = { id: genId(), plan: 'FREE', emailVerified: false, ...data } as typeof db.users extends Map<string, infer V> ? V : never
      db.users.set(user.id, user)
      return user
    }),
  },
  token: {
    findUnique: vi.fn(async ({ where, include }: { where: { tokenHash: string }; include?: { user: true } }) => {
      const row = db.tokens.find(t => t.tokenHash === where.tokenHash)
      if (!row) return null
      if (include?.user) {
        const user = db.users.get(row.userId)
        return { ...row, user: user ?? null }
      }
      return row
    }),
    create: vi.fn(async ({ data }: { data: Omit<TokenRow, 'id' | 'revokedAt'> & { revokedAt?: Date | null } }) => {
      const row: TokenRow = { id: genId(), revokedAt: null, ...data }
      db.tokens.push(row)
      return row
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = db.tokens.find(t => t.id === where.id)
      if (!row) throw new Error('not found')
      Object.assign(row, data)
      return row
    }),
    updateMany: vi.fn(async ({ where, data }: { where: Partial<TokenRow>; data: Record<string, unknown> }) => {
      let count = 0
      for (const t of db.tokens) {
        const matches =
          (where.userId    === undefined || t.userId    === where.userId) &&
          (where.tokenHash === undefined || t.tokenHash === where.tokenHash) &&
          (where.type      === undefined || t.type      === where.type) &&
          (where.revokedAt === undefined || t.revokedAt === where.revokedAt)
        if (matches) {
          Object.assign(t, data)
          count++
        }
      }
      return { count }
    }),
  },
  // In-memory "transaction" — just runs the callback with the same mock.
  // That's fine for tests; we're exercising application logic, not Postgres.
  $transaction: vi.fn(async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock)),
}

vi.mock('../db/prisma.js', () => ({ prisma: prismaMock }))

// The JWT signer is mocked — real RS256 requires a real PEM key pair.
vi.mock('../utils/jwt.js', () => ({
  signAccessToken: vi.fn((payload) => `access.${payload.sub}`),
  verifyAccessToken: vi.fn(() => null),
}))

// Bcrypt runs real but with 1 round to keep the test fast.
vi.mock('../config/env.js', async (orig) => {
  const actual = await orig() as { env: Record<string, unknown> }
  return { env: { ...actual.env, BCRYPT_ROUNDS: 4, NODE_ENV: 'test' } }
})

const authService = await import('./auth.service.js')

describe('auth.service', () => {
  beforeEach(() => {
    db.users.clear()
    db.tokens.length = 0
    nextId = 0
    vi.clearAllMocks()
  })

  describe('register + login', () => {
    it('registers a user, issues a refresh token, and can log them in', async () => {
      const reg = await authService.register('Alice', 'alice@example.com', 'hunter2-password')
      expect(reg.user.email).toBe('alice@example.com')
      expect(reg.accessToken).toBe('access.' + reg.user.id)
      expect(reg.refreshTokenRaw).toMatch(/^[a-f0-9]{64}$/)
      expect(reg.verifyTokenRaw).toMatch(/^[a-f0-9]{64}$/)

      // A REFRESH and an EMAIL_VERIFY token should exist.
      expect(db.tokens.filter(t => t.type === 'REFRESH')).toHaveLength(1)
      expect(db.tokens.filter(t => t.type === 'EMAIL_VERIFY')).toHaveLength(1)

      const login = await authService.login('alice@example.com', 'hunter2-password')
      expect(login.user.id).toBe(reg.user.id)
      expect(login.rememberMe).toBe(false)
    })

    it('rejects login with a wrong password', async () => {
      await authService.register('Bob', 'bob@example.com', 'correct-horse')
      await expect(authService.login('bob@example.com', 'wrong-password')).rejects.toMatchObject({
        message:   'Invalid email or password.',
        statusCode: 401,
        code:      'INVALID_CREDENTIALS',
      })
    })

    it('extends refresh TTL when rememberMe=true', async () => {
      await authService.register('Carol', 'carol@example.com', 'long-pass-word')
      db.tokens.length = 0 // ignore the register-issued refresh token

      const shortLogin = await authService.login('carol@example.com', 'long-pass-word', false)
      const shortExp   = db.tokens.find(t => t.tokenHash)!.expiresAt.getTime() - Date.now()

      db.tokens.length = 0
      const longLogin = await authService.login('carol@example.com', 'long-pass-word', true)
      const longExp   = db.tokens.find(t => t.tokenHash)!.expiresAt.getTime() - Date.now()

      // 30-day (remember) should be meaningfully longer than 7-day (default).
      // Allow some slack for test jitter; we just care about the order of magnitude.
      expect(longExp).toBeGreaterThan(shortExp * 2)
      expect(shortLogin.rememberMe).toBe(false)
      expect(longLogin.rememberMe).toBe(true)
    })
  })

  describe('refresh rotation', () => {
    it('revokes the old token and issues a new one on refresh', async () => {
      const reg = await authService.register('Dan', 'dan@example.com', 'rotation-test-pw')
      const originalRefresh = reg.refreshTokenRaw

      const rotated = await authService.refreshTokens(originalRefresh)
      expect(rotated.newRefreshTokenRaw).not.toBe(originalRefresh)

      // Old token row has a revokedAt timestamp now.
      const { sha256 } = await import('../utils/hash.js')
      const originalRow = db.tokens.find(t => t.tokenHash === sha256(originalRefresh))!
      expect(originalRow.revokedAt).not.toBeNull()
    })

    it('rejects replay of an already-rotated refresh token', async () => {
      const reg = await authService.register('Eve', 'eve@example.com', 'rotation-test-pw')
      await authService.refreshTokens(reg.refreshTokenRaw) // rotate once

      // Replaying the original token must fail — this is the "theft detection"
      // path; a stolen + already-used token is invalid.
      await expect(authService.refreshTokens(reg.refreshTokenRaw)).rejects.toMatchObject({
        statusCode: 401,
        code:       'INVALID_REFRESH_TOKEN',
      })
    })
  })

  describe('password reset', () => {
    it('revokes all outstanding refresh tokens when a reset completes', async () => {
      const reg = await authService.register('Frank', 'frank@example.com', 'current-password')

      // Simulate a second active session (e.g. phone app logged in too).
      await authService.login('frank@example.com', 'current-password')
      const activeRefresh = db.tokens.filter(t => t.type === 'REFRESH' && t.revokedAt === null)
      expect(activeRefresh.length).toBeGreaterThanOrEqual(2)

      // Request + execute a password reset.
      const { token } = (await authService.createPasswordResetToken('frank@example.com'))!
      await authService.resetPassword(token, 'brand-new-password')

      // All REFRESH tokens must now be revoked — forces re-login everywhere.
      const stillActive = db.tokens.filter(t => t.type === 'REFRESH' && t.revokedAt === null)
      expect(stillActive).toHaveLength(0)

      // Original password no longer works; new one does.
      await expect(authService.login('frank@example.com', 'current-password')).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      })
      await expect(authService.login('frank@example.com', 'brand-new-password')).resolves.toMatchObject({
        user: { email: 'frank@example.com' },
      })

      // Register's REFRESH counted above is also revoked — confirm reg.refreshTokenRaw is dead.
      await expect(authService.refreshTokens(reg.refreshTokenRaw)).rejects.toMatchObject({
        code: 'INVALID_REFRESH_TOKEN',
      })
    })

    it('returns null for an unknown email (no enumeration signal)', async () => {
      const result = await authService.createPasswordResetToken('ghost@nowhere.example')
      expect(result).toBeNull()
    })
  })
})
