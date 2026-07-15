/**
 * Contract tests for the cover-letter Zod schemas in @resumark/shared. These
 * guard the wire format both the client composable and the validate()
 * middleware depend on: the ≥2-parts refine, the 40-char per-part minimum, the
 * job-description cap, and the .default('') that keeps payloads from older
 * clients (no targetJobDescription yet) parsing instead of 400ing.
 */
import { describe, expect, it } from 'vitest'
import {
  AnalyzeCoverLetterSchema,
  CoverLetterDataSchema,
  SubmitCoverLetterFeedbackSchema,
} from '@resumark/shared'

const part = (n: number, ch = 'x') => ch.repeat(n)

describe('AnalyzeCoverLetterSchema', () => {
  it('accepts two well-formed parts and defaults the locale', () => {
    const result = AnalyzeCoverLetterSchema.safeParse({
      parts: { opening: part(50), bodyBring: part(100) },
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.locale).toBe('en')
  })

  it('rejects a single provided part (needs at least two)', () => {
    const result = AnalyzeCoverLetterSchema.safeParse({
      parts: { opening: part(50) },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a part under the 40-character minimum', () => {
    const result = AnalyzeCoverLetterSchema.safeParse({
      parts: { opening: part(39), bodyBring: part(100) },
    })
    expect(result.success).toBe(false)
  })

  it('does not count a too-short part toward the two-part minimum after trim', () => {
    // 39 chars + whitespace padding trims below the minimum → min(40) rejects.
    const result = AnalyzeCoverLetterSchema.safeParse({
      parts: { opening: `${part(39)} `, bodyBring: part(100) },
    })
    expect(result.success).toBe(false)
  })

  it('caps targetJobDescription at 5000 characters', () => {
    const base = { parts: { opening: part(50), closing: part(50) } }
    expect(
      AnalyzeCoverLetterSchema.safeParse({ ...base, targetJobDescription: part(5000) }).success,
    ).toBe(true)
    expect(
      AnalyzeCoverLetterSchema.safeParse({ ...base, targetJobDescription: part(5001) }).success,
    ).toBe(false)
  })
})

describe('CoverLetterDataSchema.targetJobDescription', () => {
  const legacyContent = {
    fullName: 'Jane Doe',
    jobTitle: '',
    email: 'jane@example.com',
    phone: '',
    location: '',
    date: 'July 14, 2026',
    recipientName: '',
    recipientTitle: '',
    companyName: '',
    companyAddress: '',
    opening: '',
    bodyWhy: '',
    bodyBring: '',
    closing: '',
    signature: 'Sincerely,',
    meta: { createdAt: '2026-01-01', updatedAt: '2026-01-01', version: '1.0.0' },
  }

  it("defaults to '' when a legacy payload omits it", () => {
    const result = CoverLetterDataSchema.safeParse(legacyContent)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.targetJobDescription).toBe('')
  })

  it('caps it at 5000 characters', () => {
    expect(
      CoverLetterDataSchema.safeParse({ ...legacyContent, targetJobDescription: part(5001) })
        .success,
    ).toBe(false)
  })
})

describe('SubmitCoverLetterFeedbackSchema', () => {
  const ANALYSIS = '11111111-1111-1111-1111-111111111111'

  it('accepts a per-part downvote with taxonomy reasons (including REPETITIVE)', () => {
    const result = SubmitCoverLetterFeedbackSchema.safeParse({
      analysisId: ANALYSIS,
      part: 'bodyWhy',
      vote: 'DOWN',
      reasons: ['REPETITIVE', 'TOO_GENERIC'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown part key', () => {
    const result = SubmitCoverLetterFeedbackSchema.safeParse({
      analysisId: ANALYSIS,
      part: 'signature',
      vote: 'UP',
    })
    expect(result.success).toBe(false)
  })
})
