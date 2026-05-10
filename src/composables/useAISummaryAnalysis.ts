import { ref, computed } from 'vue'
import { useCVStore } from '@/stores/cvStore'
import { apiClient, ApiError } from '@/services/apiClient'

// Module-scoped state (tüm component'lerin aynı state'i paylaşması için)
const isLoading = ref(false)
const feedback = ref('')
const suggestion = ref('')
const error = ref<string | null>(null)

export function useAISummaryAnalysis() {
  const cvStore = useCVStore()

  // hasResult computed: sonuç panelinin açılıp açılmayacağını kontrol eder
  const hasResult = computed(() => !!feedback.value || !!suggestion.value)

  // analyze fonksiyonu
  async function analyze(summary: string): Promise<void> {
    isLoading.value = true
    error.value = null
    feedback.value = ''
    suggestion.value = ''

    try {
      const res = await apiClient.post<{ success: boolean; data: { feedback: string; suggestion: string } }>(
        '/ai/analyze-summary',
        { summary },
      )
      feedback.value = res.data.feedback
      suggestion.value = res.data.suggestion
    } catch (err) {
      // Error mapping: API error'ları user-friendly mesajlara çevir
      if (err instanceof ApiError) {
        if (err.status === 401) {
          error.value = 'Please log in again to use AI features.'
        } else if (err.status === 429) {
          error.value = 'Too many requests. Please wait a moment before trying again.'
        } else if (err.status === 503) {
          error.value = 'AI service is currently unavailable. Please try again later.'
        } else if (err.status === 400) {
          error.value = 'Summary is too short or too long. Please write between 50-500 characters.'
        } else {
          error.value = err.message || 'An error occurred while analyzing your summary.'
        }
      } else {
        error.value = 'An unexpected error occurred. Please try again.'
      }
      console.error('[useAISummaryAnalysis] analyze failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  // applySuggestion fonksiyonu
  function applySuggestion(): void {
    if (suggestion.value) {
      cvStore.cvData.summary = suggestion.value
      reset()
    }
  }

  // reset fonksiyonu
  function reset(): void {
    feedback.value = ''
    suggestion.value = ''
    error.value = null
  }

  return {
    isLoading,
    feedback,
    suggestion,
    hasResult,
    error,
    analyze,
    applySuggestion,
    reset,
  }
}
