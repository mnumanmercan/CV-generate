/**
 * Unit tests for the summary-feedback service. Prisma is mocked, so these run
 * without a DB. We pin: upvotes never store reasons, downvote reasons are
 * de-duplicated, ownership is enforced (404 on missing / foreign analysis), and
 * the write is an upsert keyed by analysisId so a vote can be flipped.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

const findUniqueMock = vi.hoisted(() => vi.fn())
const upsertMock = vi.hoisted(() => vi.fn())

vi.mock('../db/prisma.js', () => ({
  prisma: {
    summaryAnalysis: { findUnique: findUniqueMock },
    summaryFeedback: { upsert: upsertMock },
  },
}))

const { summaryFeedbackService } = await import('./summaryFeedback.service.js')

const USER = 'user-1'
const ANALYSIS = '11111111-1111-1111-1111-111111111111'

afterEach(() => {
  findUniqueMock.mockReset()
  upsertMock.mockReset()
})

describe('summaryFeedbackService.record', () => {
  it('records an upvote and stores no reasons even if some are sent', async () => {
    findUniqueMock.mockResolvedValue({ userId: USER })
    upsertMock.mockResolvedValue({ analysisId: ANALYSIS, vote: 'UP', reasons: [] })
    await summaryFeedbackService.record(USER, {
      analysisId: ANALYSIS,
      vote: 'UP',
      reasons: ['TOO_GENERIC'],
    })
    expect(upsertMock.mock.calls[0][0].create.reasons).toEqual([])
    expect(upsertMock.mock.calls[0][0].update.reasons).toEqual([])
  })

  it('records a downvote with de-duplicated reasons', async () => {
    findUniqueMock.mockResolvedValue({ userId: USER })
    upsertMock.mockResolvedValue({ analysisId: ANALYSIS, vote: 'DOWN', reasons: ['TOO_GENERIC'] })
    await summaryFeedbackService.record(USER, {
      analysisId: ANALYSIS,
      vote: 'DOWN',
      reasons: ['TOO_GENERIC', 'TOO_GENERIC', 'INACCURATE'],
    })
    expect(upsertMock.mock.calls[0][0].create.reasons).toEqual(['TOO_GENERIC', 'INACCURATE'])
  })

  it('404s when the analysis does not exist', async () => {
    findUniqueMock.mockResolvedValue(null)
    await expect(
      summaryFeedbackService.record(USER, { analysisId: ANALYSIS, vote: 'UP' }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('404s when the analysis belongs to another user', async () => {
    findUniqueMock.mockResolvedValue({ userId: 'someone-else' })
    await expect(
      summaryFeedbackService.record(USER, {
        analysisId: ANALYSIS,
        vote: 'DOWN',
        reasons: ['OTHER'],
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('upserts keyed by analysisId so a user can flip their vote', async () => {
    findUniqueMock.mockResolvedValue({ userId: USER })
    upsertMock.mockResolvedValue({ analysisId: ANALYSIS, vote: 'UP', reasons: [] })
    await summaryFeedbackService.record(USER, { analysisId: ANALYSIS, vote: 'UP' })
    expect(upsertMock.mock.calls[0][0].where).toEqual({ analysisId: ANALYSIS })
  })
})
