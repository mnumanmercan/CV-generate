import { ref } from 'vue'
import { useCVStore } from '@/stores/cvStore'
import { PDF_SUCCESS_RESET_MS, PDF_ERROR_RESET_MS } from '@/constants/timing'

export type PDFExportStatus = 'idle' | 'generating' | 'success' | 'error'

// A4 portrait height in CSS pixels, matching jsPDF's own conversion:
// 297 mm × (96 px / 25.4 mm) = 1122.68 → floor to 1122 (see jspdf-plugin.js
// `toPx` helper). Clamping the element to exactly 1122 ensures
// html2canvas produces a canvas of ≤ `pxPageHeight` (=Math.floor(1588 × 297/210)
// = 2245) at scale:2, so html2pdf's `Math.ceil(pxFullHeight / pxPageHeight)`
// resolves to 1 page instead of 2. Previously 1123 forced a 1-pixel second page.
const A4_HEIGHT_PX = 1122

// ─── Transform neutralization helpers ────────────────────────────────────────
// html2canvas includes parent CSS transforms in its render context.
// Any transform: scale() on an ancestor of #cv-preview will produce a
// blurry, incorrectly-sized PDF. We temporarily clear them before capture.

interface TransformSnapshot {
  el: HTMLElement
  inlineValue: string
}

// ─── Element normalization for capture ───────────────────────────────────────
// Before capture we strip the box-shadow (its vertical bleed causes html2canvas
// to expand the canvas height beyond A4_HEIGHT_PX) and clamp the element to
// exactly one A4 page tall (height + overflow:hidden). offsetHeight then
// returns A4_HEIGHT_PX, which we pass as windowHeight so the captured canvas
// maps to exactly one page. Everything is restored in the finally block — the
// live preview is unaffected.

interface ElementSnapshot {
  boxShadow: string
  height: string
  overflow: string
}

function normalizeForCapture(element: HTMLElement): ElementSnapshot {
  const snapshot: ElementSnapshot = {
    boxShadow: element.style.boxShadow,
    height: element.style.height,
    overflow: element.style.overflow,
  }
  element.style.boxShadow = 'none'
  element.style.height = `${A4_HEIGHT_PX}px`
  element.style.overflow = 'hidden'
  return snapshot
}

function restoreAfterCapture(element: HTMLElement, snapshot: ElementSnapshot): void {
  element.style.boxShadow = snapshot.boxShadow
  element.style.height = snapshot.height
  element.style.overflow = snapshot.overflow
}

function neutralizeAncestorTransforms(target: HTMLElement): TransformSnapshot[] {
  const snapshots: TransformSnapshot[] = []
  let el: HTMLElement | null = target.parentElement

  while (el && el !== document.body) {
    const computed = window.getComputedStyle(el).transform
    const isTransformed =
      computed !== 'none' && computed !== 'matrix(1, 0, 0, 1, 0, 0)'

    if (isTransformed) {
      snapshots.push({ el, inlineValue: el.style.transform })
      el.style.transform = 'none'
    }
    el = el.parentElement
  }
  return snapshots
}

function restoreAncestorTransforms(snapshots: TransformSnapshot[]): void {
  for (const { el, inlineValue } of snapshots) {
    el.style.transform = inlineValue
  }
}

// ─── ATS invisible text layer ────────────────────────────────────────────────
// The visual PDF is a JPEG rendered by html2canvas. Without intervention the
// PDF has zero extractable text (filter /DCTDecode only) and ATS parsers that
// don't run OCR silently score it as empty.
//
// We overlay every DOM text node onto the same jsPDF using text rendering
// mode 3 ("invisible" — PDF spec 1.7 §9.3.6). The glyphs are positioned
// correctly for reading order and are extracted by pdftotext / ATS, but not
// drawn to the page so the JPEG remains the only visible layer.
//
// Coordinates: measured on the live DOM AFTER transform neutralization and
// element normalization (1122 px clamp + overflow:hidden), which is exactly
// what html2canvas saw. `x = rect.left - rootRect.left` gives position
// relative to the top-left of `#cv-preview` in CSS pixels; multiplying by
// 25.4/96 converts to mm (jsPDF's configured unit).
//
// Pages: only emit text whose top falls within a page that toPdf already
// created. After the 1122 fix a one-page CV has exactly one page; we never
// call pdf.addPage() from here (that's what corrupted the previous attempt).

interface JsPdfLike {
  setPage(n: number): void
  getNumberOfPages?: () => number
  internal?: { getNumberOfPages?: () => number }
  text(
    text: string,
    x: number,
    y: number,
    opts?: { baseline?: string; renderingMode?: string; maxWidth?: number },
  ): void
  setFont(fontName: string): void
  setFontSize(size: number): void
  setTextColor(r: number, g: number, b: number): void
}

const PX_TO_MM = 25.4 / 96

function collectVisibleTextNodes(root: Element): Text[] {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.textContent
      if (!text || !text.trim()) return NodeFilter.FILTER_REJECT

      const parent = (node as Text).parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (parent.tagName === 'STYLE' || parent.tagName === 'SCRIPT') {
        return NodeFilter.FILTER_REJECT
      }
      // Respect display:none / visibility:hidden on any ancestor up to root.
      // offsetParent === null catches display:none (except position:fixed,
      // which we don't use inside #cv-preview).
      if (parent.offsetParent === null && parent !== root) {
        return NodeFilter.FILTER_REJECT
      }
      const style = window.getComputedStyle(parent)
      if (style.visibility === 'hidden' || style.display === 'none') {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })

  let current = walker.nextNode()
  while (current) {
    nodes.push(current as Text)
    current = walker.nextNode()
  }
  return nodes
}

function getPageCount(pdf: JsPdfLike): number {
  if (typeof pdf.getNumberOfPages === 'function') return pdf.getNumberOfPages()
  const internalGet = pdf.internal?.getNumberOfPages
  if (typeof internalGet === 'function') return internalGet()
  return 1
}

function injectAtsTextLayer(pdf: JsPdfLike, rootEl: HTMLElement): void {
  const rootRect = rootEl.getBoundingClientRect()
  const pageCount = getPageCount(pdf)
  const maxYPx = pageCount * A4_HEIGHT_PX

  // Use Helvetica (jsPDF built-in) at a neutral 10pt size. The actual glyphs
  // never paint (renderingMode: 'invisible'), so exact visual font is
  // irrelevant — only the character sequence and position matter for ATS.
  pdf.setFont('helvetica')
  pdf.setFontSize(10)
  pdf.setTextColor(0, 0, 0)

  const nodes = collectVisibleTextNodes(rootEl)

  for (const node of nodes) {
    const raw = node.textContent
    if (!raw) continue
    const text = raw.replace(/\s+/g, ' ').trim()
    if (!text) continue

    let rect: DOMRect
    try {
      const range = document.createRange()
      range.selectNodeContents(node)
      rect = range.getBoundingClientRect()
    } catch {
      continue
    }

    // Zero-size boxes (collapsed whitespace, etc.) carry no reading signal.
    if (rect.width === 0 && rect.height === 0) continue

    const xPx = rect.left - rootRect.left
    const yPx = rect.top - rootRect.top

    // Skip text outside the pages toPdf created. We never grow the PDF
    // from here — that's the addPage() trap that broke the previous attempt.
    if (yPx < 0 || yPx >= maxYPx) continue
    if (xPx < 0) continue

    const pageNum = Math.min(pageCount, Math.max(1, Math.floor(yPx / A4_HEIGHT_PX) + 1))
    const yPxOnPage = yPx - (pageNum - 1) * A4_HEIGHT_PX

    // Explicit setPage EVERY iteration — never rely on jsPDF's internal
    // current-page cursor, which may point to the last addImage'd page.
    pdf.setPage(pageNum)

    const xMm = xPx * PX_TO_MM
    const yMm = yPxOnPage * PX_TO_MM

    try {
      pdf.text(text, xMm, yMm, { baseline: 'top', renderingMode: 'invisible' })
    } catch {
      // jsPDF's built-in fonts are WinAnsi-limited — a single unsupported
      // glyph shouldn't kill the whole export.
    }
  }
}

// ─── Export function ──────────────────────────────────────────────────────────
export function usePDFExport() {
  const status = ref<PDFExportStatus>('idle')
  const errorMessage = ref<string>('')
  const overflowWarning = ref(false)
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleReset(ms: number): void {
    if (resetTimer !== null) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      status.value = 'idle'
      errorMessage.value = ''
      resetTimer = null
    }, ms)
  }

  async function exportPDF(elementId: string): Promise<void> {
    const cvStore = useCVStore()
    const rawName = cvStore.cvData.personal.fullName || 'CV'
    // Sanitize: strip characters illegal in filenames on all major platforms.
    const safeName = rawName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').trim() || 'CV'
    const element = document.getElementById(elementId)

    if (!element) {
      status.value = 'error'
      errorMessage.value = 'CV preview element not found.'
      return
    }

    status.value = 'generating'
    errorMessage.value = ''
    // Cancel any pending reset timer from a previous export so it doesn't
    // overwrite the new status mid-export.
    if (resetTimer !== null) {
      clearTimeout(resetTimer)
      resetTimer = null
    }

    // Reset scroll position on the preview container so capture starts from
    // the top of the document, not the current scroll offset.
    const scrollContainer = element.closest<HTMLElement>('.overflow-auto')
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }

    // Wait for the browser's font loading pipeline to complete.  Google Fonts
    // loaded via CSS @import may resolve slightly after document.fonts.ready,
    // so we also poll document.fonts.check() for the primary typeface.
    await document.fonts.ready
    const fontCheckPromise = new Promise<void>((resolve) => {
      const check = (): void => {
        if (document.fonts.check('1em Inter') || document.fonts.check('1em "DM Sans"')) {
          resolve()
        } else {
          requestAnimationFrame(check)
        }
      }
      // Give it at most 1 s; resolve regardless so export isn't blocked forever.
      const deadline = setTimeout(resolve, 1000)
      check()
      void deadline
    })
    await fontCheckPromise

    // Issue 1: neutralize parent transforms so html2canvas renders at 100%
    const transformSnapshots = neutralizeAncestorTransforms(element)

    // Detect content overflow BEFORE clamping so we can warn the user.
    overflowWarning.value = element.scrollHeight > A4_HEIGHT_PX

    // Issue 6: strip box-shadow and clamp height to exactly one A4 page so
    // html2canvas never captures more than A4_HEIGHT_PX and no blank second
    // page appears (see A4_HEIGHT_PX comment above for the 1122 derivation).
    const elementSnapshot = normalizeForCapture(element)

    try {
      const html2pdf = (await import('html2pdf.js')).default

      // Issue 2: margin is 0 — the CV element has its own internal padding
      // (p-10 ≈ 10.5mm). Adding PDF margins on top creates double-spacing
      // and forces html2pdf.js to scale the content down to the reduced
      // content area, distorting proportions.
      const options = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `${safeName}_CV.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          // Prevent html2canvas from reading scroll offset
          scrollX: 0,
          scrollY: 0,
          windowWidth: element.offsetWidth,
          windowHeight: element.offsetHeight,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      }

      // Chain: toContainer → toCanvas → toPdf → get(pdf) → inject invisible
      // text layer → save.
      //
      // Why stay inside the Worker chain for the injection:
      // html2pdf's Worker (node_modules/html2pdf.js/src/worker.js) is a
      // prototype-inheriting Promise. Root state (`prop.pdf` etc.) is shared
      // across all descendants of the same chain via __proto__. If we break
      // out with a bare `await worker.get('pdf')` and then call
      // `pdf.save()` directly, we skip the chain's save_main wrapper and lose
      // the guarantee that toPdf finished committing addImage before we
      // started mutating the jsPDF instance. That was the exact failure mode
      // of the earlier fix (blank page 1, CV on page 2). Keeping everything
      // in a single `.then(...).save()` sequence preserves the invariant.
      //
      // The .d.ts for `.then` / `.get` returns Promise<T>, but at runtime the
      // library wraps back into a Worker (worker.js Worker.convert), so
      // `.save()` is callable. We assert the type inline.
      type WorkerChain = Promise<unknown> & { save: (filename?: string) => Promise<void> }

      const chain = html2pdf()
        .set(options)
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf: unknown) => {
          try {
            injectAtsTextLayer(pdf as JsPdfLike, element)
          } catch (injectErr) {
            // Never let text-layer failure block the visible PDF.
            console.warn(
              '[usePDFExport] ATS text layer injection failed; PDF will be saved without it.',
              injectErr,
            )
          }
        }) as unknown as WorkerChain

      await chain.save()

      status.value = 'success'
      scheduleReset(PDF_SUCCESS_RESET_MS)
    } catch (err) {
      console.error('PDF generation failed:', err)
      status.value = 'error'
      errorMessage.value =
        err instanceof Error
          ? err.message
          : 'PDF generation failed. Please try again.'
      scheduleReset(PDF_ERROR_RESET_MS)
    } finally {
      // Always restore — even if export fails
      restoreAfterCapture(element, elementSnapshot)
      restoreAncestorTransforms(transformSnapshots)
    }
  }

  return {
    status,
    errorMessage,
    overflowWarning,
    exportPDF,
  }
}
