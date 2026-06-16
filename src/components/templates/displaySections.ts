import type { SectionKey } from '@/types/cv.types'

/**
 * A renderable entry in a template's body: either a single full-width section,
 * or a multi-column row that groups several sections side by side.
 */
export type DisplaySection =
  | { grouped: false; key: SectionKey }
  | { grouped: true; keys: SectionKey[] }

// Sections that share the compact multi-column row, in fixed column order.
// Certifications and Languages have always shared a row; Education is appended
// as a third column so the three short sections sit together at the bottom.
const COLUMN_KEYS: SectionKey[] = ['certifications', 'languages', 'education']

// The row stands in for the certifications/languages block, so it appears at
// whichever of those two comes first in the section order. Education is pulled
// out of its own slot and joins the row rather than anchoring it — this keeps
// the row where users expect it (the bottom) instead of jumping to Education's
// usual position near the top.
const ANCHOR_KEYS: SectionKey[] = ['certifications', 'languages']

/**
 * Fold an ordered list of section keys into display entries, collapsing the
 * column-sharing sections into a single multi-column row.
 *
 * The row is emitted once, at its anchor position; the remaining column members
 * are absorbed into it and skipped. If fewer than two column members are
 * present (or no anchor exists), each renders as a normal full-width section.
 *
 * @param orderedKeys section keys already filtered to those the template renders
 */
export function buildDisplaySections(orderedKeys: SectionKey[]): DisplaySection[] {
  const columnMembers = COLUMN_KEYS.filter((key) => orderedKeys.includes(key))
  const anchor = orderedKeys.find((key) => ANCHOR_KEYS.includes(key))
  const canGroup = anchor !== undefined && columnMembers.length > 1

  const result: DisplaySection[] = []
  for (const key of orderedKeys) {
    if (canGroup && COLUMN_KEYS.includes(key)) {
      // Emit the whole row once at the anchor; absorb the other members.
      if (key === anchor) result.push({ grouped: true, keys: columnMembers })
      continue
    }
    result.push({ grouped: false, key })
  }
  return result
}
