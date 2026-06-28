import { ref, computed } from 'vue'
import { useCVStore } from '@/stores/cvStore'
import { useI18n } from '@/composables/useI18n'
import { apiClient, ApiError } from '@/services/apiClient'
import { AnalyzeSummaryResponseSchema } from '@resumark/shared'
import type { FeedbackVoteValue, SummaryFeedbackReason } from '@resumark/shared'

// Module-scoped state (tüm component'lerin aynı state'i paylaşması için)
const isLoading = ref(false)
const feedback = ref('')
const suggestion = ref('')
const error = ref<string | null>(null)
// Server-generated handle for the current analysis. Sent back when the user
// votes on this output (POST /ai/feedback) so the vote joins to its exact result.
const analysisId = ref<string | null>(null)
// The user's vote on the current analysis (null = not voted yet).
const vote = ref<FeedbackVoteValue | null>(null)
const isVoting = ref(false)
const voteError = ref<string | null>(null)

export function useAISummaryAnalysis() {
  const cvStore = useCVStore()
  const { t, locale } = useI18n()

  // hasResult computed: sonuç panelinin açılıp açılmayacağını kontrol eder
  const hasResult = computed(() => !!feedback.value || !!suggestion.value)

  // Bounded CV context so the rewrite is role-aligned and grounded in the
  // candidate's real experience (not generic / fabricated). Truncated to the
  // shared schema's caps so a long field never trips server validation.
  function buildContext() {
    const cv = cvStore.cvData

    const jobTitle = cv.personal.jobTitle?.trim().slice(0, 150) || undefined

    const experience = cv.experience
      .slice(0, 8)
      .map((e) => ({
        title: (e.position ?? '').trim().slice(0, 150),
        company: e.company?.trim() ? e.company.trim().slice(0, 150) : undefined,
      }))
      .filter((e) => e.title.length > 0)

    const skills = cv.skills
      .flatMap((s) => s.items)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20)
      .map((s) => s.slice(0, 60))

    return {
      jobTitle,
      experience: experience.length ? experience : undefined,
      skills: skills.length ? skills : undefined,
    }
  }

  async function analyze(summary: string): Promise<void> {
    isLoading.value = true
    error.value = null
    feedback.value = ''
    suggestion.value = ''
    analysisId.value = null
    vote.value = null
    voteError.value = null

    try {
      const raw = await apiClient.post<unknown>('/ai/analyze-summary', {
        summary,
        locale: locale.value === 'tr' ? 'tr' : 'en',
        ...buildContext(),
      })
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
      analysisId.value = parsed.data.data.analysisId
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

  // Record an up/down vote on the current analysis. Optimistic: the UI flips
  // immediately and only rolls back if the write fails. Reasons travel only with
  // a downvote (the server ignores them on an upvote regardless).
  async function submitFeedback(
    v: FeedbackVoteValue,
    reasons: SummaryFeedbackReason[] = [],
  ): Promise<void> {
    if (!analysisId.value || isVoting.value) return
    const previous = vote.value
    vote.value = v
    isVoting.value = true
    voteError.value = null
    try {
      await apiClient.post<unknown>('/ai/feedback', {
        analysisId: analysisId.value,
        vote: v,
        ...(v === 'DOWN' && reasons.length ? { reasons } : {}),
      })
    } catch (err) {
      vote.value = previous
      voteError.value = t('ai.vote.error')
      console.error('[useAISummaryAnalysis] feedback failed:', err)
    } finally {
      isVoting.value = false
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
    analysisId.value = null
    vote.value = null
    voteError.value = null
  }

  return {
    isLoading,
    feedback,
    suggestion,
    analysisId,
    vote,
    isVoting,
    voteError,
    hasResult,
    error,
    analyze,
    submitFeedback,
    applySuggestion,
    reset,
  }
}
