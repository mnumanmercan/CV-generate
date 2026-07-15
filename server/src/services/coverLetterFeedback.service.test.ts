/**
 * Unit tests for the cover-letter feedback service. Prisma is mocked, so these
 * run without a DB. Same guarantees as the summary-feedback tests — ownership
 * 404, upvotes drop reasons, downvote reasons de-duped — plus the per-part
 * contract: the wire key maps to the Prisma enum and the upsert is keyed by
 * the (analysisId, part) compound unique so votes on different parts coexist.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

const findUniqueMock = vi.hoisted(() => vi.fn())
const upsertMock = vi.hoisted(() => vi.fn())

vi.mock('../db/prisma.js', () => ({
  prisma: {
    coverLetterAnalysis: { findUnique: findUniqueMock },
    coverLetterFeedback: { upsert: upsertMock },
  },
}))

const { coverLetterFeedbackService } = await import('./coverLetterFeedback.service.js')

const USER = 'user-1'
const ANALYSIS = '11111111-1111-1111-1111-111111111111'

afterEach(() => {
  findUniqueMock.mockReset()
  upsertMock.mockReset()
})

describe('coverLetterFeedbackService.record', () => {
  it('maps the wire part key to the Prisma enum and keys the upsert by (analysisId, part)', async () => {
    findUniqueMock.mockResolvedValue({ userId: USER })
    upsertMock.mockResolvedValue({
      analysisId: ANALYSIS,
      part: 'BODY_WHY',
      vote: 'UP',
      reasons: [],
    })
    await coverLetterFeedbackService.record(USER, {
      analysisId: ANALYSIS,
      part: 'bodyWhy',
      vote: 'UP',
    })
    const call = upsertMock.mock.calls[0][0]
    expect(call.where).toEqual({ analysisId_part: { analysisId: ANALYSIS, part: 'BODY_WHY' } })
    expect(call.create.part).toBe('BODY_WHY')
  })

  it('records an upvote and stores no reasons even if some are sent', async () => {
    findUniqueMock.mockResolvedValue({ userId: USER })
    upsertMock.mockResolvedValue({ analysisId: ANALYSIS, part: 'OPENING', vote: 'UP', reasons: [] })
    await coverLetterFeedbackService.record(USER, {
      analysisId: ANALYSIS,
      part: 'opening',
      vote: 'UP',
      reasons: ['REPETITIVE'],
    })
    expect(upsertMock.mock.calls[0][0].create.reasons).toEqual([])
    expect(upsertMock.mock.calls[0][0].update.reasons).toEqual([])
  })

  it('records a downvote with de-duplicated reasons', async () => {
    findUniqueMock.mockResolvedValue({ userId: USER })
    upsertMock.mockResolvedValue({
      analysisId: ANALYSIS,
      part: 'CLOSING',
      vote: 'DOWN',
      reasons: ['REPETITIVE'],
    })
    await coverLetterFeedbackService.record(USER, {
      analysisId: ANALYSIS,
      part: 'closing',
      vote: 'DOWN',
      reasons: ['REPETITIVE', 'REPETITIVE', 'TOO_GENERIC'],
    })
    expect(upsertMock.mock.calls[0][0].create.reasons).toEqual(['REPETITIVE', 'TOO_GENERIC'])
  })

  it('allows separate votes on separate parts of the same analysis', async () => {
    findUniqueMock.mockResolvedValue({ userId: USER })
    upsertMock.mockResolvedValue({})
    await coverLetterFeedbackService.record(USER, {
      analysisId: ANALYSIS,
      part: 'opening',
      vote: 'UP',
    })
    await coverLetterFeedbackService.record(USER, {
      analysisId: ANALYSIS,
      part: 'closing',
      vote: 'DOWN',
    })
    expect(upsertMock.mock.calls[0][0].where.analysisId_part.part).toBe('OPENING')
    expect(upsertMock.mock.calls[1][0].where.analysisId_part.part).toBe('CLOSING')
  })

  it('404s when the analysis does not exist', async () => {
    findUniqueMock.mockResolvedValue(null)
    await expect(
      coverLetterFeedbackService.record(USER, {
        analysisId: ANALYSIS,
        part: 'opening',
        vote: 'UP',
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('404s when the analysis belongs to another user', async () => {
    findUniqueMock.mockResolvedValue({ userId: 'someone-else' })
    await expect(
      coverLetterFeedbackService.record(USER, {
        analysisId: ANALYSIS,
        part: 'bodyBring',
        vote: 'DOWN',
        reasons: ['OTHER'],
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
    expect(upsertMock).not.toHaveBeenCalled()
  })
})
