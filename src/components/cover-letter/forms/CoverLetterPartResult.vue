<!-- One part's AI review card: feedback, suggested rewrite, apply/discard, and
     the per-part vote row. Rendered under the matching textarea in ContentForm;
     mirrors SummaryForm's result panel. -->
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useI18n } from '@/composables/useI18n'
  import { useAICoverLetterAnalysis } from '@/composables/useAICoverLetterAnalysis'
  import { COVER_LETTER_FEEDBACK_REASONS } from '@resumark/shared'
  import type { CoverLetterPartKey, CoverLetterFeedbackReason } from '@resumark/shared'

  const props = defineProps<{ part: CoverLetterPartKey }>()

  const { t } = useI18n()
  const {
    analysisId,
    results,
    votes,
    applied,
    isVoting,
    voteError,
    submitFeedback,
    applySuggestion,
    discardSuggestion,
  } = useAICoverLetterAnalysis()

  const result = computed(() => results.value[props.part])
  const vote = computed(() => votes.value[props.part])
  const isApplied = computed(() => applied.value[props.part])

  // ── Per-part vote reason picker ─────────────────────────────────────────
  const reasons = COVER_LETTER_FEEDBACK_REASONS
  const showReasons = ref(false)
  const selectedReasons = ref<CoverLetterFeedbackReason[]>([])

  // A fresh analysis clears any in-progress reason picker.
  watch(analysisId, () => {
    showReasons.value = false
    selectedReasons.value = []
  })

  function onUpvote() {
    showReasons.value = false
    submitFeedback(props.part, 'UP')
  }

  function onDownvote() {
    // Record the downvote immediately so the signal isn't lost if the user
    // skips the reasons, then reveal the optional reason chips.
    submitFeedback(props.part, 'DOWN')
    showReasons.value = true
  }

  function toggleReason(r: CoverLetterFeedbackReason) {
    const i = selectedReasons.value.indexOf(r)
    if (i === -1) selectedReasons.value.push(r)
    else selectedReasons.value.splice(i, 1)
  }

  function sendReasons() {
    submitFeedback(props.part, 'DOWN', selectedReasons.value)
    showReasons.value = false
  }
</script>

<template>
  <div
    v-if="result"
    class="mt-2 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-4"
    role="region"
    aria-live="polite"
    :aria-label="`${t(`ai.coverLetter.parts.${part}`)} — AI`"
  >
    <!-- Feedback -->
    <div>
      <h3 class="text-xs font-mono text-accent uppercase tracking-wider mb-2">
        {{ t('ai.feedback.label') }}
      </h3>
      <p class="text-sm text-secondary leading-relaxed">{{ result.feedback }}</p>
    </div>

    <!-- Suggestion -->
    <div>
      <h3 class="text-xs font-mono text-accent uppercase tracking-wider mb-2">
        {{ t('ai.suggestion.label') }}
      </h3>
      <div class="bg-paper-card rounded-lg border border-muted/20 p-3 min-h-20">
        <p class="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
          {{ result.suggestion }}
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 justify-end">
      <span v-if="isApplied" class="flex items-center gap-1.5 text-xs text-emerald-400 mr-auto">
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
        {{ t('ai.coverLetter.appliedLabel') }}
      </span>
      <button
        class="btn-ghost px-3 py-2 text-xs font-medium rounded-lg transition-colors"
        @click="discardSuggestion(part)"
      >
        {{ t('ai.suggestion.discard') }}
      </button>
      <button
        v-if="!isApplied"
        class="btn-accent px-3 py-2 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
        @click="applySuggestion(part)"
      >
        {{ t('ai.suggestion.apply') }}
      </button>
    </div>

    <!-- Per-part voting — the Evals signal -->
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
</template>
