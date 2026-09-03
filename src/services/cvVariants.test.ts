import { describe, it, expect } from 'vitest'
import {
  applySharedSections,
  sharedSectionsMatch,
  buildVariantSeed,
  clearTailoredSections,
  cloneCV,
} from './cvVariants'
import { createEmptyCVData, type CVData } from '@/types/cv.types'

function makeCV(overrides: Partial<CVData> = {}): CVData {
  const base = createEmptyCVData()
  base.personal.fullName = 'Ada Lovelace'
  base.personal.email = 'ada@example.com'
  base.education = [
    {
      id: crypto.randomUUID(),
      institution: 'Cambridge',
      degree: 'BSc',
      field: 'Maths',
      startDate: '2010',
      endDate: '2014',
    },
  ]
  base.languages = [{ id: crypto.randomUUID(), name: 'English', proficiency: 'Native' }]
  base.summary = 'Backend engineer.'
  base.skills = [{ id: crypto.randomUUID(), category: 'Languages', items: ['Go'] }]
  return { ...base, ...overrides }
}

describe('applySharedSections', () => {
  it('copies the shared sections and leaves the tailored ones alone', () => {
    const source = makeCV()
    const target = makeCV()
    target.personal.fullName = 'Stale Name'
    target.education = []
    target.summary = 'Data scientist.'
    target.skills = [{ id: crypto.randomUUID(), category: 'Tools', items: ['Pandas'] }]

    applySharedSections(source, target)

    // shared → adopted from source
    expect(target.personal.fullName).toBe('Ada Lovelace')
    expect(target.education).toHaveLength(1)
    expect(target.languages[0]?.name).toBe('English')
    // tailored → untouched
    expect(target.summary).toBe('Data scientist.')
    expect(target.skills[0]?.category).toBe('Tools')
  })

  it('deep-clones, so later edits to the source do not leak into the target', () => {
    const source = makeCV()
    const target = makeCV()

    applySharedSections(source, target)
    source.personal.fullName = 'Changed After Copy'
    source.education[0]!.institution = 'Changed Too'

    expect(target.personal.fullName).toBe('Ada Lovelace')
    expect(target.education[0]?.institution).toBe('Cambridge')
  })
})

describe('sharedSectionsMatch', () => {
  // Compared by deep equality, item UUIDs included. Real siblings are clones of
  // one another (that is how propagation creates them), so they share ids; two
  // independently built documents would never match and are not a real case.
  it('is true for siblings differing only in tailored sections', () => {
    const a = makeCV()
    const b = cloneCV(a)
    b.summary = 'Totally different summary.'
    b.projects = [{ id: crypto.randomUUID(), name: 'p', description: '', techStack: [], link: '' }]
    expect(sharedSectionsMatch(a, b)).toBe(true)
  })

  it('is false once a shared section diverges', () => {
    const a = makeCV()
    const b = cloneCV(a)
    b.personal.phone = '+90 555 000 00 00'
    expect(sharedSectionsMatch(a, b)).toBe(false)
  })

  it('is true again after propagation reconciles the two', () => {
    const a = makeCV()
    const b = cloneCV(a)
    b.personal.phone = '+90 555 000 00 00'
    b.education = []

    applySharedSections(a, b)

    expect(sharedSectionsMatch(a, b)).toBe(true)
  })
})

describe('buildVariantSeed', () => {
  it('duplicates the whole document by default', () => {
    const source = makeCV()
    const seed = buildVariantSeed(source)

    expect(seed.summary).toBe('Backend engineer.')
    expect(seed.skills).toHaveLength(1)
    expect(seed.personal.fullName).toBe('Ada Lovelace')
  })

  it('keeps the shared facts but clears the tailored sections in blank mode', () => {
    const source = makeCV()
    const seed = buildVariantSeed(source, 'blank')

    expect(seed.summary).toBe('')
    expect(seed.skills).toEqual([])
    expect(seed.experience).toEqual([])
    expect(seed.projects).toEqual([])
    // shared facts survive — that is the whole point of a variant
    expect(seed.personal.fullName).toBe('Ada Lovelace')
    expect(seed.education).toHaveLength(1)
    expect(seed.languages).toHaveLength(1)
  })

  it('does not alias the source document', () => {
    const source = makeCV()
    const seed = buildVariantSeed(source)
    seed.personal.fullName = 'Someone Else'
    expect(source.personal.fullName).toBe('Ada Lovelace')
  })

  it('stamps fresh timestamps rather than inheriting the source dates', () => {
    const source = makeCV()
    source.meta.createdAt = '2020-01-01T00:00:00.000Z'
    const seed = buildVariantSeed(source)
    expect(seed.meta.createdAt).not.toBe('2020-01-01T00:00:00.000Z')
  })
})

describe('clearTailoredSections', () => {
  it('never blanks the shared sections', () => {
    // Regression guard: a full reset here would propagate empty personal /
    // education data to every sibling on the next tab switch, turning
    // "clear this version" into "wipe them all".
    const data = makeCV()
    clearTailoredSections(data)

    expect(data.summary).toBe('')
    expect(data.skills).toEqual([])
    expect(data.personal.fullName).toBe('Ada Lovelace')
    expect(data.education).toHaveLength(1)
    expect(data.languages).toHaveLength(1)
  })
})

describe('cloneCV', () => {
  it('produces an independent copy', () => {
    const source = makeCV()
    const copy = cloneCV(source)
    copy.education[0]!.institution = 'Elsewhere'
    expect(source.education[0]?.institution).toBe('Cambridge')
  })
})
