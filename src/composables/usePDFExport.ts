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
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
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
      // Always restore transforms — even if export fails
      restoreAncestorTransforms(transformSnapshots)
    }
  }

  return {
    status,
    errorMessage,
    exportPDF,
  }
}
