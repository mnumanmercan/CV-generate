<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { analyzeSummary, getKeywordHints } from '@/services/atsFormatter'

  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

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
        Professional Summary
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
      </div>
    </div>

    <!-- ATS warnings -->
    <div
      v-for="warn in warnings"
      :key="warn.field"
      class="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
      role="alert"
    >
      <svg class="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {{ warn.message }}
    </div>

    <!-- ATS keyword hints -->
    <div
      v-if="hints.length"
      id="summary-hints"
      class="flex flex-col gap-1.5"
      aria-label="ATS writing tips"
    >
      <p class="text-xs font-mono text-accent uppercase tracking-wider">ATS Tips</p>
      <div
        v-for="hint in hints"
        :key="hint"
        class="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-secondary"
      >
        <span class="text-accent shrink-0" aria-hidden="true">→</span>
        {{ hint }}
      </div>
    </div>
  </div>
</template>
