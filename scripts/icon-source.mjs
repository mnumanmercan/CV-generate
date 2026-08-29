/**
 * Single source for every rendered Resumark icon: the favicon, the PNG
 * fallbacks, the PWA/Apple icons and the Open Graph card.
 *
 * The mark is the wordmark's sienna dot promoted into a résumé — a dot marking
 * a heading rule with a ragged body block beneath. Two optical cuts exist:
 *
 *   • DETAIL  (4 rows) — the in-app mark. Authored in
 *     src/components/ui/brandMark.geometry.ts, MIRRORED below. Keep the two in
 *     step by hand, the same convention this repo uses for
 *     cv.types.ts ↔ packages/shared.
 *
 *   • COMPACT (3 rows, heavier strokes) — for 16–32px, where the detail cut's
 *     3.4-unit rows disappear. A strict subset: same dot, same heading rule,
 *     same ragged edge, one body row dropped.
 *
 * Both cuts deliberately resist reading as a hamburger menu: the first row is
 * dot-marked and inset, the heading/body gap is far wider than the body
 * leading, the right edge is ragged, and the heading rule is heavier than the
 * body. Changing any of those weakens the mark at favicon size.
 */

export const ACCENT = '#B8532A' // --accent, light
export const ACCENT_DARK = '#D97E4F' // --accent, dark
export const PAPER = '#F6F2EA' // --paper, light
export const INK = '#12110F' // --ink, light
export const MUTED = '#6B645A' // --muted, light
export const RULE = 'rgba(0,0,0,0.10)' // --rule, light

/** DETAIL cut — mirror of src/components/ui/brandMark.geometry.ts (30×28). */
export const DETAIL = {
  viewBox: { width: 30, height: 28 },
  dot: { cx: 4, cy: 4, r: 4 },
  rule: { x: 11, y: 1.7, width: 13, height: 4.6, rx: 2.3 },
  body: [
    { x: 0, y: 13, width: 30, height: 3.4, rx: 1.7 },
    { x: 0, y: 18.4, width: 23, height: 3.4, rx: 1.7 },
    { x: 0, y: 23.8, width: 13, height: 3.4, rx: 1.7 },
  ],
}

/** COMPACT cut — 32×32, inset 1 unit so nothing kisses the edge. */
export const COMPACT = {
  viewBox: { width: 32, height: 32 },
  dot: { cx: 6, cy: 7, r: 5 },
  rule: { x: 14.5, y: 4, width: 15.5, height: 6, rx: 3 },
  body: [
    { x: 1, y: 17.5, width: 30, height: 4.6, rx: 2.3 },
    { x: 1, y: 25.2, width: 20, height: 4.6, rx: 2.3 },
  ],
}

const RULE_OPACITY = 0.9

/**
 * The mark's shapes, as SVG elements. `cls` lets the favicon theme them.
 *
 * `bodyOpacity` is an optical adjustment, not a style choice: the body rows
 * read as intended at 0.5 on a poster, but wash out below ~32px, so the small
 * cuts lift them. The heading must stay visibly heavier either way — that
 * hierarchy is what stops the mark reading as a hamburger menu.
 */
function markShapes(cut, { cls = '', bodyOpacity = 0.5 } = {}) {
  const c = cls ? ` class="${cls}"` : ''
  return [
    `<circle${c} cx="${cut.dot.cx}" cy="${cut.dot.cy}" r="${cut.dot.r}"/>`,
    `<rect${c} x="${cut.rule.x}" y="${cut.rule.y}" width="${cut.rule.width}" height="${cut.rule.height}" rx="${cut.rule.rx}" opacity="${RULE_OPACITY}"/>`,
    ...cut.body.map(
      (r) =>
        `<rect${c} x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${r.rx}" opacity="${bodyOpacity}"/>`,
    ),
  ].join('\n  ')
}

/**
 * The favicon itself: transparent (so it sits on any tab-bar colour) with an
 * embedded colour-scheme swap. Chrome and Firefox honour the media query in an
 * SVG favicon; Safari ignores SVG favicons entirely and takes the PNG below,
 * which is why that one gets an opaque paper plate instead.
 */
export function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COMPACT.viewBox.width} ${COMPACT.viewBox.height}" fill="${ACCENT}">
  <style>
    @media (prefers-color-scheme: dark) { .m { fill: ${ACCENT_DARK}; } }
  </style>
  ${markShapes(COMPACT, { cls: 'm', bodyOpacity: 0.6 })}
</svg>
`
}

/**
 * A square icon on an opaque paper plate — Apple touch icon, PWA icons, and
 * the PNG favicon fallbacks. Transparency is wrong for all of these: iOS
 * composites a transparent touch icon onto black.
 *
 * `inset` is the fraction of the plate left empty around the mark. Maskable
 * icons need ≥20% so the platform's crop can't clip the mark.
 */
export function plateIconSvg({
  size,
  inset = 0.18,
  background = PAPER,
  cut = COMPACT,
  bodyOpacity = 0.6,
}) {
  const box = size * (1 - inset * 2)
  const scale = box / cut.viewBox.width
  const height = cut.viewBox.height * scale
  const x = size * inset
  const y = (size - height) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${background}"/>
  <g transform="translate(${x} ${y}) scale(${scale})" fill="${ACCENT}">
  ${markShapes(cut, { bodyOpacity })}
  </g>
</svg>
`
}

/**
 * Open Graph / Twitter card, 1200×630. The full detail cut plus the wordmark,
 * set on paper — the same lockup the site header shows, at poster scale.
 */
export function ogImageSvg({ width = 1200, height = 630 } = {}) {
  const margin = 96
  const markScale = 5 // detail cut is authored at 1 unit = 1px
  const markW = DETAIL.viewBox.width * markScale
  const markH = DETAIL.viewBox.height * markScale
  const lockupY = 196
  const markY = lockupY
  const wordX = margin + markW + 30
  const wordSize = 148
  const wordBaseline = markY + markH / 2 + wordSize * 0.35

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${PAPER}"/>
  <rect width="${width}" height="10" fill="${ACCENT}"/>

  <g transform="translate(${margin} ${markY}) scale(${markScale})" fill="${ACCENT}">
  ${markShapes(DETAIL)}
  </g>

  <text x="${wordX}" y="${wordBaseline}" font-family="Instrument Serif" font-size="${wordSize}" fill="${INK}" letter-spacing="-2">Resumark</text>

  <line x1="${margin}" y1="416" x2="${width - margin}" y2="416" stroke="${RULE}" stroke-width="1.5"/>

  <text x="${margin}" y="470" font-family="DM Sans" font-size="34" fill="${MUTED}">Create ATS-compliant professional resumes in minutes.</text>
  <text x="${margin}" y="524" font-family="DM Sans" font-size="34" fill="${MUTED}">Real-time preview, instant PDF download — free.</text>

  <text x="${margin}" y="580" font-family="DM Sans" font-size="20" font-weight="500" fill="${ACCENT}" letter-spacing="3.2">RESUMARK.APP</text>
</svg>
`
}
