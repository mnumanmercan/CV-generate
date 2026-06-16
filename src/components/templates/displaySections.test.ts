/**
 * Unit tests for buildDisplaySections — the shared logic that folds the
 * column-sharing sections into a single multi-column row used by every CV
 * template. Certifications + Languages always share the row; Education is an
 * opt-in third column via the `includeEducation` flag (meta.educationInColumns).
 *
 * Pure function, no DOM or store needed.
 */
import { describe, expect, it } from 'vitest'
import { buildDisplaySections } from './displaySections'
import type { SectionKey } from '@/types/cv.types'

const FULL_ORDER: SectionKey[] = [
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
]

describe('buildDisplaySections', () => {
  describe('3-column mode (includeEducation = true)', () => {
    it('groups certifications, languages and education into one row at the cert/lang anchor', () => {
      expect(buildDisplaySections(FULL_ORDER, true)).toEqual([
        { grouped: false, key: 'experience' },
        { grouped: false, key: 'skills' },
        { grouped: false, key: 'projects' },
        { grouped: true, keys: ['certifications', 'languages', 'education'] },
      ])
    })

    it('keeps a fixed column order (cert, lang, edu) regardless of input order', () => {
      const order: SectionKey[] = ['languages', 'education', 'certifications']
      expect(buildDisplaySections(order, true)).toEqual([
        { grouped: true, keys: ['certifications', 'languages', 'education'] },
      ])
    })

    it('groups education with a single anchor (e.g. certifications) into a two-column row', () => {
      expect(buildDisplaySections(['certifications', 'education'], true)).toEqual([
        { grouped: true, keys: ['certifications', 'education'] },
      ])
    })

    it('renders education full-width when no cert/lang anchor exists', () => {
      expect(buildDisplaySections(['experience', 'education', 'skills'], true)).toEqual([
        { grouped: false, key: 'experience' },
        { grouped: false, key: 'education' },
        { grouped: false, key: 'skills' },
      ])
    })
  })

  describe('2-column mode (includeEducation = false)', () => {
    it('keeps Education full-width in its own slot and pairs only cert + lang', () => {
      expect(buildDisplaySections(FULL_ORDER, false)).toEqual([
        { grouped: false, key: 'experience' },
        { grouped: false, key: 'education' },
        { grouped: false, key: 'skills' },
        { grouped: false, key: 'projects' },
        { grouped: true, keys: ['certifications', 'languages'] },
      ])
    })

    it('pairs certifications and languages when education is absent', () => {
      expect(buildDisplaySections(['experience', 'certifications', 'languages'], false)).toEqual([
        { grouped: false, key: 'experience' },
        { grouped: true, keys: ['certifications', 'languages'] },
      ])
    })

    it('renders a lone column member full-width (nothing to group with)', () => {
      expect(buildDisplaySections(['experience', 'certifications'], false)).toEqual([
        { grouped: false, key: 'experience' },
        { grouped: false, key: 'certifications' },
      ])
    })
  })
})
