/**
 * Resumark brand mark — "marked lines".
 *
 * The mark is the wordmark's sienna dot promoted into a whole résumé: a dot
 * marking a heading rule, with a ragged body block beneath it. Five properties
 * keep it from reading as a hamburger menu at favicon sizes — do not tune any
 * of them away casually:
 *
 *   1. row 1 carries the dot and is inset from the left
 *   2. a wide gap splits heading from body; body rows sit tight together
 *   3. the right edge is ragged (widths descend)
 *   4. four rows, not three
 *   5. the heading rule is heavier than the body rows
 *
 * Coordinates are authored so that 1 user unit = 1 CSS px at the default `md`
 * size — the dot is 8px across, matching the plain dot this mark replaces.
 *
 * The favicon uses an optically bolder cut of the same mark (one body row
 * dropped, strokes thickened) so it survives 16px. That cut is mirrored in
 * `scripts/icon-source.mjs`; keep the two in step by hand, the same convention
 * this repo already uses for cv.types.ts ↔ packages/shared.
 */

/** viewBox the coordinates below are authored against. */
export const MARK_VIEWBOX = { width: 30, height: 28 } as const

/** Dot diameter in user units — the unit the whole lockup is scaled by. */
export const MARK_DOT_DIAMETER = 8

/** The dot: row 1's leading mark, and the only thing visible at rest. */
export const MARK_DOT = { cx: 4, cy: 4, r: 4 } as const

/** Row 1's heading rule — heavier than the body, inset to clear the dot. */
export const MARK_RULE = { x: 11, y: 1.7, width: 13, height: 4.6, rx: 2.3 } as const

/** Body rows, top to bottom. Descending widths give the ragged right edge. */
export const MARK_BODY_ROWS = [
  { x: 0, y: 13, width: 30, height: 3.4, rx: 1.7 },
  { x: 0, y: 18.4, width: 23, height: 3.4, rx: 1.7 },
  { x: 0, y: 23.8, width: 13, height: 3.4, rx: 1.7 },
] as const

/**
 * How far the mark overhangs to the right of the dot.
 *
 * At rest only the dot is painted, so the lockup cancels this overhang with an
 * equal negative margin — that keeps the resting logo pixel-identical to the
 * bare dot it replaces. On hover the wordmark slides right by this much
 * (transform only, so no layout shift) to uncover the rows.
 */
export const MARK_OVERHANG = MARK_VIEWBOX.width - MARK_DOT_DIAMETER

/** Distance the dot travels from its resting (vertically centred) position. */
export const MARK_DOT_REST_OFFSET = MARK_VIEWBOX.height / 2 - MARK_DOT.cy
