import { ref, computed } from 'vue'
import { useCVStore } from '@/stores/cvStore'
import { useI18n } from '@/composables/useI18n'
import { apiClient, ApiError } from '@/services/apiClient'
import { AnalyzeSummaryResponseSchema } from '@resumark/shared'

// Module-scoped state (tüm component'lerin aynı state'i paylaşması için)
const isLoading = ref(false)
const feedback = ref('')
const suggestion = ref('')
const error = ref<string | null>(null)

export function useAISummaryAnalysis() {
  const cvStore = useCVStore()
  const { t } = useI18n()

  // hasResult computed: sonuç panelinin açılıp açılmayacağını kontrol eder
  const hasResult = computed(() => !!feedback.value || !!suggestion.value)

  async function analyze(summary: string): Promise<void> {
    isLoading.value = true
    error.value = null
    feedback.value = ''
    suggestion.value = ''

    try {
      const raw = await apiClient.post<unknown>('/ai/analyze-summary', { summary })
      // Defensive: validate the response shape even though the server is the
      // contract owner — a future regression in the AI parser, a misbehaving
      // proxy, or a stale cache could all break the invariant, and reading
      // `res.data.feedback` on a malformed body would silently NaN the UI.
      const parsed = AnalyzeSummaryResponseSchema.safeParse(raw)
      if (!parsed.success) {
        throw new ApiError(502, 'AI_INVALID_SHAPE', 'AI returned an unexpected response shape.')
      }
      feedback.value = parsed.data.data.feedback
      suggestion.value = parsed.data.data.suggestion
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          error.value = t('ai.errors.unauthorized')
        } else if (err.status === 429) {
          error.value = t('ai.errors.tooManyRequests')
        } else if (err.status === 503 || err.status === 504) {
          error.value = t('ai.errors.serviceUnavailable')
        } else if (err.status === 400) {
          error.value = t('ai.errors.invalidInput')
        } else {
          error.value = t('ai.errors.unexpected')
        }
      } else {
        error.value = t('ai.errors.unexpected')
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
