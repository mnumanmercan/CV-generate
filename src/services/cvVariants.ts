import type { CVData } from '@/types/cv.types'
import { createEmptyCVData } from '@/types/cv.types'

// ─── CV variant helpers ───────────────────────────────────────────────────────
// Pure functions over CVData, kept out of the store so they can be unit-tested
// without Pinia. See packages/shared/src/constants/variants.ts for the
// shared-vs-tailored split these implement.

/**
 * Deep clone. Uses the JSON round-trip rather than `structuredClone` to match
 * `cvStore.saveToStorage()` — CVData is plain JSON by construction (it is
 * persisted as JSONB), so the two are equivalent here and staying consistent
 * keeps one clone strategy in the codebase.
 */
export function cloneCV<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Copy the shared sections from `source` into `target`, in place.
 *
 * The map is keyed by a mapped type over the shared keys, so adding a key to
 * SHARED_SECTION_KEYS without adding its copier here is a compile error rather
 * than a section that silently stops syncing.
 */
const SHARED_COPIERS: {
  [K in 'personal' | 'education' | 'certifications' | 'languages']: (
    source: CVData,
    target: CVData,
  ) => void
} = {
  personal: (s, t) => {
    t.personal = cloneCV(s.personal)
  },
  education: (s, t) => {
    t.education = cloneCV(s.education)
  },
  certifications: (s, t) => {
    t.certifications = cloneCV(s.certifications)
  },
  languages: (s, t) => {
    t.languages = cloneCV(s.languages)
  },
}

export function applySharedSections(source: CVData, target: CVData): void {
  for (const copy of Object.values(SHARED_COPIERS)) copy(source, target)
}

/** True when the two documents' shared sections already agree. */
export function sharedSectionsMatch(a: CVData, b: CVData): boolean {
  return (
    JSON.stringify([a.personal, a.education, a.certifications, a.languages]) ===
    JSON.stringify([b.personal, b.education, b.certifications, b.languages])
  )
}

/**
 * Seed for a new variant.
 *
 * `duplicate` (the default) copies the whole document — the common case is
 * "start from my CV and tailor it down for this posting", so an empty
 * Experience list would just mean retyping. `blank` keeps only the shared
 * facts and clears the tailored sections for a from-scratch rewrite.
 */
export function buildVariantSeed(
  source: CVData,
  mode: 'duplicate' | 'blank' = 'duplicate',
): CVData {
  const seed = cloneCV(source)
  if (mode === 'blank') {
    const empty = createEmptyCVData()
    seed.summary = empty.summary
    seed.experience = empty.experience
    seed.skills = empty.skills
    seed.projects = empty.projects
  }
  const now = new Date().toISOString()
  seed.meta = { ...seed.meta, createdAt: now, updatedAt: now }
  return seed
}

/**
 * Reset the tailored sections of `data` in place, leaving the shared facts
 * (name, contact, education, certifications, languages) untouched.
 *
 * This is what "clear" means once variants exist: a full reset would wipe the
 * shared sections, which would then propagate the blanks to every sibling on
 * the next tab switch — turning "clear this version" into "clear all of them".
 */
export function clearTailoredSections(data: CVData): void {
  const empty = createEmptyCVData()
  data.summary = empty.summary
  data.experience = empty.experience
  data.skills = empty.skills
  data.projects = empty.projects
}
