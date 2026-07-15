<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import FormField from '@/components/form/FormField.vue'
  import CoverLetterPartResult from '@/components/cover-letter/forms/CoverLetterPartResult.vue'
  import { useI18n } from '@/composables/useI18n'
  import {
    useAICoverLetterAnalysis,
    MIN_PART_CHARS,
    MIN_PARTS,
  } from '@/composables/useAICoverLetterAnalysis'

  const { t, t_obj } = useI18n()
  const coverLetterStore = useCoverLetterStore()
  const { clData } = storeToRefs(coverLetterStore)

  const signatures = computed(() => t_obj<string[]>('coverLetter.signatures'))

  const { isLoading, error, coherence, canAnalyze, analyzableParts, analyze } =
    useAICoverLetterAnalysis()

  const isAnalyzeDisabled = computed(() => !canAnalyze.value || isLoading.value)

  // Parts still missing before analysis unlocks (0 once unlocked).
  const partsToUnlock = computed(() => Math.max(0, MIN_PARTS - analyzableParts.value.length))
</script>

<template>
  <div class="flex flex-col gap-5">
    <div>
      <FormField
        id="cl-opening"
        v-model="clData.opening"
        :label="t('coverLetter.contentOpening')"
        type="textarea"
        placeholder="I am writing to express my interest in the [Role] position at [Company]…"
        :hint="t('coverLetter.contentOpeningHint')"
        :maxlength="500"
      />
      <CoverLetterPartResult part="opening" />
    </div>

    <div>
      <FormField
        id="cl-bodyWhy"
        v-model="clData.bodyWhy"
        :label="t('coverLetter.contentBodyWhy')"
        type="textarea"
        placeholder="I am particularly drawn to [Company] because…"
        :hint="t('coverLetter.contentBodyWhyHint')"
        :maxlength="2000"
      />
      <CoverLetterPartResult part="bodyWhy" />
    </div>

    <div>
      <FormField
        id="cl-bodyBring"
        v-model="clData.bodyBring"
        :label="t('coverLetter.contentBodyBring')"
        type="textarea"
        placeholder="In my previous role at [Company], I led…"
        :hint="t('coverLetter.contentBodyBringHint')"
        :maxlength="2000"
      />
      <CoverLetterPartResult part="bodyBring" />
    </div>

    <div>
      <FormField
        id="cl-closing"
        v-model="clData.closing"
        :label="t('coverLetter.contentClosing')"
        type="textarea"
        placeholder="I would welcome the opportunity to discuss how my background…"
        :hint="t('coverLetter.contentClosingHint')"
        :maxlength="500"
      />
      <CoverLetterPartResult part="closing" />
    </div>

    <!-- AI: analyze the whole letter -->
    <div>
      <button
        :disabled="isAnalyzeDisabled"
        class="w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
        :class="[
          isAnalyzeDisabled
            ? 'bg-secondary/20 text-secondary cursor-not-allowed'
            : 'btn-accent hover:opacity-90',
        ]"
        :aria-busy="isLoading"
        @click="analyze"
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
        {{ isLoading ? t('ai.coverLetter.analyzing') : t('ai.coverLetter.analyzeButton') }}
      </button>

      <!-- Why the analyze button is locked -->
      <p
        v-if="partsToUnlock > 0"
        class="mt-1.5 text-xs text-secondary text-center"
        aria-live="polite"
      >
        {{ t('ai.coverLetter.minParts', { n: String(MIN_PARTS), chars: String(MIN_PART_CHARS) }) }}
      </p>

      <!-- Error message -->
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

      <!-- Coherence banner: the whole-letter integrity verdict -->
      <div
        v-if="coherence"
        class="mt-3 px-3 py-2.5 rounded-lg border text-xs flex flex-col gap-1.5"
        :class="
          coherence.verdict === 'consistent'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
        "
        role="status"
      >
        <span class="font-mono uppercase tracking-wider">
          {{ t('ai.coverLetter.coherence.label') }}
        </span>
        <p v-if="coherence.verdict === 'consistent'">
          {{ t('ai.coverLetter.coherence.consistent') }}
        </p>
        <template v-else>
          <p>{{ t('ai.coverLetter.coherence.issuesFound') }}</p>
          <ul class="list-disc pl-4 flex flex-col gap-1">
            <li v-for="issue in coherence.issues" :key="issue">{{ issue }}</li>
          </ul>
        </template>
      </div>
    </div>

    <!-- Signature selector -->
    <div>
      <label
        class="block text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-1.5"
        for="cl-signature"
      >
        {{ t('coverLetter.contentSignOff') }}
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="sig in signatures"
          :key="sig"
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200"
          :class="
            clData.signature === sig
              ? 'border-accent text-accent bg-accent/10'
              : 'border-overlay/10 text-secondary hover:text-primary hover:border-overlay/20'
          "
          @click="clData.signature = sig"
        >
          {{ sig }}
        </button>
      </div>
    </div>
  </div>
</template>
