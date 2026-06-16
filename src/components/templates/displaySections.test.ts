/**
 * Unit tests for buildDisplaySections — the shared logic that folds the
 * column-sharing sections (Certifications, Languages, Education) into a single
 * multi-column row used by every CV template.
 *
 * Pure function, no DOM or store needed.
 */
import { describe, expect, it } from 'vitest'
import { buildDisplaySections } from './displaySections'
import type { SectionKey } from '@/types/cv.types'

describe('buildDisplaySections', () => {
  it('groups certifications, languages and education into one row at the cert/lang anchor', () => {
    const order: SectionKey[] = [
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'languages',
    ]

    expect(buildDisplaySections(order)).toEqual([
      { grouped: false, key: 'experience' },
      { grouped: false, key: 'skills' },
      { grouped: false, key: 'projects' },
      { grouped: true, keys: ['certifications', 'languages', 'education'] },
    ])
  })

  it('keeps a fixed column order (cert, lang, edu) regardless of input order', () => {
    const order: SectionKey[] = ['languages', 'education', 'certifications']

    expect(buildDisplaySections(order)).toEqual([
      { grouped: true, keys: ['certifications', 'languages', 'education'] },
    ])
  })

  it('pairs just certifications and languages when education is absent', () => {
    const order: SectionKey[] = ['experience', 'certifications', 'languages']

    expect(buildDisplaySections(order)).toEqual([
      { grouped: false, key: 'experience' },
      { grouped: true, keys: ['certifications', 'languages'] },
    ])
  })

  it('groups education with a single anchor (e.g. certifications) into a two-column row', () => {
    const order: SectionKey[] = ['certifications', 'education']

    expect(buildDisplaySections(order)).toEqual([
      { grouped: true, keys: ['certifications', 'education'] },
    ])
  })

  it('renders education full-width when no cert/lang anchor exists', () => {
    const order: SectionKey[] = ['experience', 'education', 'skills']

    expect(buildDisplaySections(order)).toEqual([
      { grouped: false, key: 'experience' },
      { grouped: false, key: 'education' },
      { grouped: false, key: 'skills' },
    ])
  })

  it('renders a lone column member full-width (nothing to group with)', () => {
    const order: SectionKey[] = ['experience', 'certifications']

    expect(buildDisplaySections(order)).toEqual([
      { grouped: false, key: 'experience' },
      { grouped: false, key: 'certifications' },
    ])
  })
})
