<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { analyzeSummary, getKeywordHints } from '@/services/atsFormatter'
  import { useI18n } from '@/composables/useI18n'
  import { useAISummaryAnalysis } from '@/composables/useAISummaryAnalysis'

  const { t } = useI18n()
  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)
  const { isLoading, feedback, suggestion, hasResult, error, analyze, applySuggestion, reset } =
    useAISummaryAnalysis()

  const isAnalyzeDisabled = computed(() => charCount.value < 50 || isLoading.value)

  const charCount = computed(() => cvData.value.summary.trim().length)

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
    </div>
    <!-- AI Analysis Result Panel Finished -->
  </div>
</template>
