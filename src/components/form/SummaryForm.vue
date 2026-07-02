<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { analyzeSummary, getKeywordHints } from '@/services/atsFormatter'
  import { useI18n } from '@/composables/useI18n'
  import { useAISummaryAnalysis } from '@/composables/useAISummaryAnalysis'
  import { SUMMARY_FEEDBACK_REASONS, type SummaryFeedbackReason } from '@resumark/shared'

  const { t } = useI18n()
  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)
  const {
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
  } = useAISummaryAnalysis()

  const isAnalyzeDisabled = computed(() => charCount.value < 50 || isLoading.value)

  const charCount = computed(() => cvData.value.summary.trim().length)

  // Chars still missing before AI analysis unlocks (0 once unlocked)
  const charsToUnlock = computed(() => Math.max(0, 50 - charCount.value))

  // ── AI feedback voting ──────────────────────────────────────────────────
  const reasons = SUMMARY_FEEDBACK_REASONS
  const showReasons = ref(false)
  const selectedReasons = ref<SummaryFeedbackReason[]>([])

  // A fresh analysis clears any in-progress reason picker.
  watch(analysisId, () => {
    showReasons.value = false
    selectedReasons.value = []
  })

  function onUpvote() {
    showReasons.value = false
    submitFeedback('UP')
  }

  function onDownvote() {
    // Record the downvote immediately so the signal isn't lost if the user
    // skips the reasons, then reveal the optional reason chips.
    submitFeedback('DOWN')
    showReasons.value = true
  }

  function toggleReason(r: SummaryFeedbackReason) {
    const i = selectedReasons.value.indexOf(r)
    if (i === -1) selectedReasons.value.push(r)
    else selectedReasons.value.splice(i, 1)
  }

  function sendReasons() {
    submitFeedback('DOWN', selectedReasons.value)
    showReasons.value = false
  }

  const counterColor = computed(() => {
    if (charCount.value === 0) return 'text-secondary'
    if (charCount.value < 50 || charCount.value > 400) return 'text-red-400'
    if (charCount.value > 350) return 'text-yellow-400'
    return 'text-emerald-400'
  })

  const warnings = computed(() => analyzeSummary(cvData.value.summary))
  const hints = computed(() => getKeywordHints(cvData.value.summary))
</script>

<template>
  <div class="flex flex-col gap-3">
    <div>
      <label
        for="summary"
        class="text-xs font-medium text-secondary font-mono uppercase tracking-wider"
      >
        {{ t('forms.professionalSummary') }}
      </label>

      <div class="mt-1.5">
        <textarea
          id="summary"
          v-model="cvData.summary"
          placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications..."
          class="w-full px-3 py-2.5 text-sm rounded-lg resize-none h-32"
          :aria-describedby="'summary-hints summary-counter'"
          maxlength="500"
        />
        <!-- Character counter -->
        <div
          id="summary-counter"
          :class="['mt-1 text-xs font-mono text-right transition-colors', counterColor]"
          aria-live="polite"
        >
          {{ charCount }}/500
        </div>
        <!-- Analyze button -->
        <button
          :disabled="isAnalyzeDisabled"
          class="mt-3 w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
          :class="[
            isAnalyzeDisabled
              ? 'bg-secondary/20 text-secondary cursor-not-allowed'
              : 'btn-accent hover:opacity-90',
          ]"
          :aria-busy="isLoading"
          @click="analyze(cvData.summary)"
        >
          <svg
            v-if="isLoading"
            class="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ isLoading ? t('ai.analyzeButton.analyzing') : t('ai.analyzeButton.text') }}
        </button>

        <!-- Why the analyze button is locked — live countdown to the 50-char minimum -->
        <p
          v-if="charsToUnlock > 0"
          class="mt-1.5 text-xs text-secondary text-center"
          aria-live="polite"
        >
          {{ t('ai.analyzeButton.minChars', { n: String(charsToUnlock) }) }}
        </p>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
          role="alert"
        >
          <svg
            class="w-4 h-4 shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          {{ error }}
        </div>
        <!-- Analyze button Finsihed-->
      </div>
    </div>

    <!-- ATS warnings -->
    <div
      v-for="warn in warnings"
      :key="warn.field"
      class="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
      role="alert"
    >
      <svg
        class="w-3.5 h-3.5 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      {{ warn.message }}
    </div>

    <!-- ATS keyword hints -->
    <div
      v-if="hints.length"
      id="summary-hints"
      class="flex flex-col gap-1.5"
      :aria-label="t('forms.atsTipsLabel')"
    >
      <p class="text-xs font-mono text-accent uppercase tracking-wider">
        {{ t('forms.atsTipsLabel') }}
      </p>
      <div
        v-for="hint in hints"
        :key="hint"
        class="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-secondary"
      >
        <span class="text-accent shrink-0" aria-hidden="true">→</span>
        {{ hint }}
      </div>
    </div>

    <!-- AI Analysis Result Panel -->
    <div
      v-if="hasResult"
      class="mt-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-4"
      role="region"
      aria-live="polite"
      aria-label="AI Analysis Results"
    >
      <!-- Feedback Section -->
      <div>
        <h3 class="text-xs font-mono text-accent uppercase tracking-wider mb-2">
          {{ t('ai.feedback.label') }}
        </h3>
        <p class="text-sm text-secondary leading-relaxed">{{ feedback }}</p>
      </div>

      <!-- Suggestion Section -->
      <div>
        <h3 class="text-xs font-mono text-accent uppercase tracking-wider mb-2">
          {{ t('ai.suggestion.label') }}
        </h3>
        <div class="bg-paper-card rounded-lg border border-muted/20 p-3 min-h-20">
          <p class="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{{ suggestion }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 justify-end">
        <button
          class="btn-ghost px-3 py-2 text-xs font-medium rounded-lg transition-colors"
          @click="reset"
        >
          {{ t('ai.suggestion.discard') }}
        </button>
        <button
          class="btn-accent px-3 py-2 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
          @click="applySuggestion"
        >
          {{ t('ai.suggestion.apply') }}
        </button>
      </div>

      <!-- Feedback voting — the Evals signal -->
      <div class="border-t border-emerald-500/15 pt-3">
        <!-- Not voted yet -->
        <div v-if="vote === null" class="flex items-center gap-3">
          <span class="text-xs text-secondary">{{ t('ai.vote.prompt') }}</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              :disabled="isVoting"
              :aria-label="t('ai.vote.up')"
              :title="t('ai.vote.up')"
              class="p-1.5 rounded-lg text-secondary transition-colors hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
              @click="onUpvote"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.7"
                  d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.04 9.04 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.5 4.5 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.5 4.5 0 0 0-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.96 8.96 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                />
              </svg>
            </button>
            <button
              type="button"
              :disabled="isVoting"
              :aria-label="t('ai.vote.down')"
              :title="t('ai.vote.down')"
              class="p-1.5 rounded-lg text-secondary transition-colors hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              @click="onDownvote"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.7"
                  d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 0 1-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54m.023-8.25H16.48a4.5 4.5 0 0 1-1.423-.23l-3.114-1.04a4.5 4.5 0 0 0-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 0 0 2.25 12c0 .434.023.863.068 1.285.09 1.022 1.01 1.715 2.036 1.715h2.622M7.5 15v5.625c0 .621.504 1.125 1.125 1.125.621 0 1.125-.504 1.125-1.125V18.75m0 0a3 3 0 0 1 .879-2.122L13.5 13.5"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Downvoted: optional reason chips -->
        <div v-else-if="vote === 'DOWN' && showReasons" class="flex flex-col gap-2">
          <span class="text-xs text-secondary">{{ t('ai.vote.reasonsPrompt') }}</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="r in reasons"
              :key="r"
              type="button"
              :aria-pressed="selectedReasons.includes(r)"
              class="px-2.5 py-1 text-xs rounded-full border transition-colors"
              :class="
                selectedReasons.includes(r)
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'border-muted/30 text-secondary hover:border-accent/30'
              "
              @click="toggleReason(r)"
            >
              {{ t(`ai.vote.reasons.${r}`) }}
            </button>
          </div>
          <div class="flex justify-end">
            <button
              type="button"
              :disabled="isVoting"
              class="btn-ghost px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              @click="sendReasons"
            >
              {{ t('ai.vote.done') }}
            </button>
          </div>
        </div>

        <!-- Voted — thank you -->
        <div v-else class="flex items-center gap-2 text-xs text-emerald-400">
          <svg
            class="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
          {{ t('ai.vote.thanks') }}
        </div>

        <!-- Vote error -->
        <p v-if="voteError" class="mt-1.5 text-xs text-red-400">{{ voteError }}</p>
      </div>
    </div>
    <!-- AI Analysis Result Panel Finished -->
  </div>
</template>
