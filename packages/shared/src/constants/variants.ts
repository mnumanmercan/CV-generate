import type { SectionKey } from '../types/cv.types.js'

// CV variants — one tailored CV per job posting.
//
// A variant is a COMPLETE, standalone CVData document stored in its own `CV`
// row. Nothing is composed or merged at read time, so PDF export, public
// sharing (/p/:slug) and the migration ladder all keep working on a variant
// exactly as they do on a single CV.
//
// The split below is what makes variants ergonomic rather than N copies to
// maintain by hand: SHARED sections are the facts that don't change per
// application, and the client keeps them identical across every variant.

/**
 * Sections that stay identical across every variant — edit once, all update.
 * These are the facts that don't change per application.
 */
export const SHARED_SECTION_KEYS: readonly SectionKey[] = [
  'personal',
  'education',
  'certifications',
  'languages',
] as const

/**
 * Sections tailored per job posting — independent in every variant.
 * `meta` (templateId, sectionOrder) is per-variant too, but it isn't a
 * SectionKey so it isn't listed here; it simply never propagates.
 */
export const VARIANT_SECTION_KEYS: readonly SectionKey[] = [
  'summary',
  'experience',
  'skills',
  'projects',
] as const

/**
 * Maximum variants a Pro user may keep. Mirrors CV_LIMIT.PRO — that is the
 * value the server enforces; this one drives the "+" tab's disabled state so
 * the UI stops short of a 402 instead of provoking one.
 */
export const CV_VARIANT_LIMIT = 5
