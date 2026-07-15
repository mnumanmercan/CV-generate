import { ref, computed } from 'vue'
import { useCVStore } from '@/stores/cvStore'
import { useCoverLetterStore } from '@/stores/coverLetterStore'
import { useI18n } from '@/composables/useI18n'
import { apiClient, ApiError, TimeoutError } from '@/services/apiClient'
import { AnalyzeCoverLetterResponseSchema, COVER_LETTER_PARTS } from '@resumark/shared'
import type {
  CoverLetterPartKey,
  CoverLetterPartResult,
  FeedbackVoteValue,
  CoverLetterFeedbackReason,
} from '@resumark/shared'

// A part must have at least this many trimmed characters to be worth
// critiquing (mirrors the shared schema's min(40)); at least MIN_PARTS parts
// must qualify before the letter can be analyzed at all.
export const MIN_PART_CHARS = 40
export const MIN_PARTS = 2

// Field caps per part — mirror of CoverLetterDataSchema / AnalyzeCoverLetterSchema.
const PART_MAX: Record<CoverLetterPartKey, number> = {
  opening: 500,
  bodyWhy: 2000,
  bodyBring: 2000,
  closing: 500,
}

type PartRecord<T> = Record<CoverLetterPartKey, T>

function emptyPartRecord<T>(value: T): PartRecord<T> {
  return { opening: value, bodyWhy: value, bodyBring: value, closing: value }
}

interface Coherence {
  verdict: 'consistent' | 'issues_found'
  issues: string[]
}

// Module-scoped state (tüm component'lerin aynı state'i paylaşması için)
const isLoading = ref(false)
const error = ref<string | null>(null)
// Server-generated handle for the current analysis. Sent back on every
// per-part vote (POST /ai/cover-letter-feedback).
const analysisId = ref<string | null>(null)
const results = ref<PartRecord<CoverLetterPartResult | null>>(emptyPartRecord(null))
const coherence = ref<Coherence | null>(null)
// Per-part vote + applied flags for the current analysis. `applied` lets a
// card show its "applied" state without discarding the other parts' cards.
const votes = ref<PartRecord<FeedbackVoteValue | null>>(emptyPartRecord(null))
const applied = ref<PartRecord<boolean>>(emptyPartRecord(false))
const isVoting = ref(false)
const voteError = ref<string | null>(null)

export function useAICoverLetterAnalysis() {
  const cvStore = useCVStore()
  const coverLetterStore = useCoverLetterStore()
  const { t, locale } = useI18n()

  const hasResult = computed(() => COVER_LETTER_PARTS.some((p) => results.value[p] !== null))

  // Parts currently long enough to analyze.
  const analyzableParts = computed(() =>
    COVER_LETTER_PARTS.filter((p) => coverLetterStore.clData[p].trim().length >= MIN_PART_CHARS),
  )

  const canAnalyze = computed(() => analyzableParts.value.length >= MIN_PARTS)

  // Bounded letter + CV context, truncated to the shared schema's caps so a
  // long field never trips server validation. CV experience/skills ground the
  // rewrites in the candidate's real background (same digests as the summary
  // analyzer); the letter's own recipient fields aim the company-fit review.
  function buildContext() {
    const cl = coverLetterStore.clData
    const cv = cvStore.cvData

    const jobTitle =
      cl.jobTitle?.trim().slice(0, 150) || cv.personal.jobTitle?.trim().slice(0, 150) || undefined
    const companyName = cl.companyName?.trim().slice(0, 200) || undefined
    const recipientName = cl.recipientName?.trim().slice(0, 100) || undefined
    const targetJobDescription = cl.targetJobDescription?.trim().slice(0, 5000) || undefined

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
      companyName,
      recipientName,
      targetJobDescription,
      experience: experience.length ? experience : undefined,
      skills: skills.length ? skills : undefined,
    }
  }

  async function analyze(): Promise<void> {
    if (!canAnalyze.value || isLoading.value) return

    isLoading.value = true
    error.value = null
    results.value = emptyPartRecord(null)
    coherence.value = null
    analysisId.value = null
    votes.value = emptyPartRecord(null)
    applied.value = emptyPartRecord(false)
    voteError.value = null

    const parts: Partial<Record<CoverLetterPartKey, string>> = {}
    for (const p of analyzableParts.value) {
      parts[p] = coverLetterStore.clData[p].trim().slice(0, PART_MAX[p])
    }

    try {
      const raw = await apiClient.post<unknown>(
        '/ai/analyze-cover-letter',
        {
          parts,
          locale: locale.value === 'tr' ? 'tr' : 'en',
          ...buildContext(),
        },
        // Four rewrites take 15–30s of LLM generation; the client must outlast
        // the server's own 45s Anthropic ceiling so real failures surface as
        // the server's 504, not a premature client abort.
        { timeoutMs: 60_000 },
      )
      // Defensive: validate the response shape even though the server is the
      // contract owner (same rationale as useAISummaryAnalysis).
      const parsed = AnalyzeCoverLetterResponseSchema.safeParse(raw)
      if (!parsed.success) {
        throw new ApiError(502, 'AI_INVALID_SHAPE', 'AI returned an unexpected response shape.')
      }
      const data = parsed.data.data
      for (const p of COVER_LETTER_PARTS) {
        results.value[p] = data[p]
      }
      coherence.value = data.coherence
      analysisId.value = data.analysisId
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          error.value = t('ai.errors.unauthorized')
        } else if (err.status === 429) {
          error.value = t('ai.errors.tooManyRequests')
        } else if (err.status === 503 || err.status === 504) {
          error.value = t('ai.errors.serviceUnavailable')
        } else if (err.status === 400 || err.status === 422) {
          // validate() rejects with 422 (observed); 400 kept for parity with
          // the summary composable's mapping.
          error.value = t('ai.errors.coverLetterInvalidInput')
        } else {
          error.value = t('ai.errors.unexpected')
        }
      } else if (err instanceof TimeoutError) {
        error.value = t('ai.errors.serviceUnavailable')
      } else {
        error.value = t('ai.errors.unexpected')
      }
      console.error('[useAICoverLetterAnalysis] analyze failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Record an up/down vote on ONE PART of the current analysis. Optimistic:
  // the UI flips immediately and rolls back if the write fails. Reasons travel
  // only with a downvote.
  async function submitFeedback(
    part: CoverLetterPartKey,
    v: FeedbackVoteValue,
    reasons: CoverLetterFeedbackReason[] = [],
  ): Promise<void> {
    if (!analysisId.value || isVoting.value) return
    const previous = votes.value[part]
    votes.value[part] = v
    isVoting.value = true
    voteError.value = null
    try {
      await apiClient.post<unknown>('/ai/cover-letter-feedback', {
        analysisId: analysisId.value,
        part,
        vote: v,
        ...(v === 'DOWN' && reasons.length ? { reasons } : {}),
      })
    } catch (err) {
      votes.value[part] = previous
      voteError.value = t('ai.vote.error')
      console.error('[useAICoverLetterAnalysis] feedback failed:', err)
    } finally {
      isVoting.value = false
    }
  }

  // Apply one part's suggestion into the letter. Deliberately does NOT reset
  // the panel: the user reviews and applies the four suggestions independently.
  function applySuggestion(part: CoverLetterPartKey): void {
    const suggestion = results.value[part]?.suggestion
    if (!suggestion) return
    coverLetterStore.clData[part] = suggestion.slice(0, PART_MAX[part])
    applied.value[part] = true
  }

  // Dismiss one part's result card without touching the others.
  function discardSuggestion(part: CoverLetterPartKey): void {
    results.value[part] = null
    votes.value[part] = null
    applied.value[part] = false
  }

  function reset(): void {
    results.value = emptyPartRecord(null)
    coherence.value = null
    error.value = null
    analysisId.value = null
    votes.value = emptyPartRecord(null)
    applied.value = emptyPartRecord(false)
    voteError.value = null
  }

  return {
    isLoading,
    error,
    analysisId,
    results,
    coherence,
    votes,
    applied,
    isVoting,
    voteError,
    hasResult,
    analyzableParts,
    canAnalyze,
    analyze,
    submitFeedback,
    applySuggestion,
    discardSuggestion,
    reset,
  }
}
