/**
 * Renders every icon asset from scripts/icon-source.mjs into public/.
 *
 * Outputs are committed, so the production build never depends on this script
 * or on @resvg/resvg-js — run `npm run icons` only when the mark changes.
 *
 * Text rendering needs real font files; scripts/fonts/ carries Instrument Serif
 * and DM Sans (both OFL, see scripts/fonts/README.md). They are used here only,
 * never bundled.
 */
import { Resvg } from '@resvg/resvg-js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { faviconSvg, ogImageSvg, plateIconSvg, ACCENT, PAPER } from './icon-source.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = join(here, '..', 'public')
const fontsDir = join(here, 'fonts')

mkdirSync(publicDir, { recursive: true })

const fontOptions = {
  loadSystemFonts: false,
  fontFiles: [join(fontsDir, 'InstrumentSerif-Regular.ttf'), join(fontsDir, 'DMSans.ttf')],
  defaultFontFamily: 'DM Sans',
}

function png(svg, width, name) {
  const out = new Resvg(svg, { font: fontOptions, fitTo: { mode: 'width', value: width } })
    .render()
    .asPng()
  writeFileSync(join(publicDir, name), out)
  console.log(`  ${name.padEnd(26)} ${width}px  ${(out.length / 1024).toFixed(1)} kB`)
}

console.log('Resumark icons →  public/')

// The SVG favicon is the primary; it carries its own dark-mode swap.
writeFileSync(join(publicDir, 'favicon.svg'), faviconSvg())
console.log('  favicon.svg')

// PNG fallbacks (Safari, older browsers) get an opaque paper plate so they
// stay legible on a dark tab bar, where a bare sienna mark washes out.
const smallPlate = plateIconSvg({ size: 64, inset: 0.09 })
png(smallPlate, 32, 'favicon-32.png')
png(smallPlate, 16, 'favicon-16.png')

png(plateIconSvg({ size: 180, inset: 0.16 }), 180, 'apple-touch-icon.png')
png(plateIconSvg({ size: 192, inset: 0.14 }), 192, 'icon-192.png')
png(plateIconSvg({ size: 512, inset: 0.14 }), 512, 'icon-512.png')
// Maskable: ≥20% safe zone so platform cropping can't clip the mark.
png(plateIconSvg({ size: 512, inset: 0.26 }), 512, 'icon-512-maskable.png')

png(ogImageSvg(), 1200, 'og-image.png')

writeFileSync(
  join(publicDir, 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'Resumark',
      short_name: 'Resumark',
      description: 'ATS-friendly professional CV builder.',
      start_url: '/',
      display: 'standalone',
      background_color: PAPER,
      theme_color: ACCENT,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  ) + '\n',
)
console.log('  site.webmanifest')
