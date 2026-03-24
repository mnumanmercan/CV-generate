import { ref } from 'vue'
import { useCVStore } from '@/stores/cvStore'

export type PDFExportStatus = 'idle' | 'generating' | 'success' | 'error'

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

    try {
      // Dynamically import html2pdf.js to keep initial bundle size lean
      const html2pdf = (await import('html2pdf.js')).default

      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${fullName.replace(/\s+/g, '_')}_CV.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      }

      await html2pdf().set(options).from(element).save()
      status.value = 'success'

      // Reset to idle after toast timeout
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
    }
  }

  return {
    status,
    errorMessage,
    exportPDF,
  }
}
