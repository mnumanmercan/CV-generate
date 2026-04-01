import { ref } from 'vue'
import { useCVStore } from '@/stores/cvStore'

export type PDFExportStatus = 'idle' | 'generating' | 'success' | 'error'

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
// to expand the canvas height beyond 1123px) and clamp the element to exactly
// one A4 page tall (height + overflow:hidden).  offsetHeight then returns 1123,
// which we pass as windowHeight so the captured canvas maps to exactly one page.
// Everything is restored in the finally block — the live preview is unaffected.

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
  element.style.height = '1123px'
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

// ─── Export function ──────────────────────────────────────────────────────────
export function usePDFExport() {
  const status = ref<PDFExportStatus>('idle')
  const errorMessage = ref<string>('')

  async function exportPDF(elementId: string): Promise<void> {
    const cvStore = useCVStore()
    const fullName = cvStore.cvData.personal.fullName || 'CV'
    const element = document.getElementById(elementId)

    if (!element) {
      status.value = 'error'
      errorMessage.value = 'CV preview element not found.'
      return
    }

    status.value = 'generating'
    errorMessage.value = ''

    // Issue 5: reset scroll position on the preview container so capture
    // starts from the top of the document, not the current scroll offset.
    const scrollContainer = element.closest<HTMLElement>('.overflow-auto')
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }

    // Issue 3: wait for all fonts (Inter, DM Sans) to be fully rendered
    // before html2canvas begins rasterising.
    await document.fonts.ready

    // Issue 1: neutralize parent transforms so html2canvas renders at 100%
    const transformSnapshots = neutralizeAncestorTransforms(element)
    // Issue 6: strip box-shadow and clamp height to exactly one A4 page so
    // html2canvas never captures more than 1123px and no blank second page appears.
    const elementSnapshot = normalizeForCapture(element)

    try {
      const html2pdf = (await import('html2pdf.js')).default

      // Issue 2: margin is 0 — the CV element has its own internal padding
      // (p-10 ≈ 10.5mm). Adding PDF margins on top creates double-spacing
      // and forces html2pdf.js to scale the content down to the reduced
      // content area, distorting proportions.
      const options = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `${fullName.replace(/\s+/g, '_')}_CV.pdf`,
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

      await html2pdf().set(options).from(element).save()
      status.value = 'success'

      setTimeout(() => {
        status.value = 'idle'
      }, 3000)
    } catch (err) {
      console.error('PDF generation failed:', err)
      status.value = 'error'
      errorMessage.value =
        err instanceof Error
          ? err.message
          : 'PDF generation failed. Please try again.'

      setTimeout(() => {
        status.value = 'idle'
        errorMessage.value = ''
      }, 4000)
    } finally {
      // Always restore — even if export fails
      restoreAfterCapture(element, elementSnapshot)
      restoreAncestorTransforms(transformSnapshots)
    }
  }

  return {
    status,
    errorMessage,
    exportPDF,
  }
}
