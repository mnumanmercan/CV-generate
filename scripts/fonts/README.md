# Vendored fonts

Used only by `npm run icons` (scripts/generate-icons.mjs) to draw text into
`public/og-image.png`. They are **not** bundled into the app — the site loads
these faces from Google Fonts at runtime (see index.html).

| File | Family | License |
|---|---|---|
| `InstrumentSerif-Regular.ttf` | Instrument Serif — the display face | [OFL-InstrumentSerif.txt](OFL-InstrumentSerif.txt) |
| `DMSans.ttf` | DM Sans (variable) — the UI face | [OFL-DMSans.txt](OFL-DMSans.txt) |

Both are SIL Open Font License 1.1, which permits redistribution provided the
license travels with the font. Keep the license files alongside them.
