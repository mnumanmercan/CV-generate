/**
 * Pins the CV_LIMITS ↔ Zod schema wiring: the same constants the builder
 * uses as input maxlengths must be what the draft save schema enforces.
 * If someone edits a schema cap without going through CV_LIMITS (or vice
 * versa), the at-the-cap case here breaks.
 */
import { describe, expect, it } from 'vitest'
import { CreateCVSchema, CV_LIMITS } from '@resumark/shared'

function draftContent(summary: string, bullet = 'Did a thing') {
  return {
    personal: {
      fullName: 'Jane Doe',
      jobTitle: 'Engineer',
      email: 'jane@example.com',
      phone: '+1 555 000 0000',
      location: 'NYC',
    },
    summary,
    experience: [
      {
        id: '5f0e1a9c-9b1a-4c5e-8f2d-3a4b5c6d7e8f',
        company: 'Acme',
        position: 'Engineer',
        startDate: '01/2020',
        endDate: 'Present',
        bullets: [bullet],
      },
    ],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    meta: {
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      version: '1.4.0',
      templateId: 'classic' as const,
    },
  }
}

describe('CreateCVSchema size caps come from CV_LIMITS', () => {
  it('accepts a summary exactly at the cap', () => {
    const result = CreateCVSchema.safeParse({
      content: draftContent('x'.repeat(CV_LIMITS.summary.max)),
    })
    expect(result.success).toBe(true)
  })

  it('rejects a summary one character over the cap', () => {
    const result = CreateCVSchema.safeParse({
      content: draftContent('x'.repeat(CV_LIMITS.summary.max + 1)),
    })
    expect(result.success).toBe(false)
  })

  it('accepts a bullet exactly at the cap and rejects one over it', () => {
    const atCap = CreateCVSchema.safeParse({
      content: draftContent('ok', 'b'.repeat(CV_LIMITS.experience.bullet)),
    })
    expect(atCap.success).toBe(true)

    const overCap = CreateCVSchema.safeParse({
      content: draftContent('ok', 'b'.repeat(CV_LIMITS.experience.bullet + 1)),
    })
    expect(overCap.success).toBe(false)
  })
})
