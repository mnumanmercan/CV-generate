<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import FormField from '@/components/form/FormField.vue'

  const coverLetterStore = useCoverLetterStore()
  const { clData } = storeToRefs(coverLetterStore)

  const SIGNATURES = ['Sincerely,', 'Best regards,', 'Kind regards,', 'Yours faithfully,', 'Warm regards,']
</script>

<template>
  <div class="flex flex-col gap-5">
    <FormField
      id="cl-opening"
      v-model="clData.opening"
      label="Opening Paragraph"
      type="textarea"
      placeholder="I am writing to express my interest in the [Role] position at [Company]…"
      hint="Introduce yourself and the role you're applying for (2–4 sentences)"
    />

    <FormField
      id="cl-bodyWhy"
      v-model="clData.bodyWhy"
      label="Why This Company / Role"
      type="textarea"
      placeholder="I am particularly drawn to [Company] because…"
      hint="Explain why this company excites you and aligns with your goals"
    />

    <FormField
      id="cl-bodyBring"
      v-model="clData.bodyBring"
      label="What You Bring"
      type="textarea"
      placeholder="In my previous role at [Company], I led…"
      hint="Highlight your most relevant skills and achievements"
    />

    <FormField
      id="cl-closing"
      v-model="clData.closing"
      label="Closing Paragraph"
      type="textarea"
      placeholder="I would welcome the opportunity to discuss how my background…"
      hint="Thank the reader and express your enthusiasm to continue the conversation"
    />

    <!-- Signature selector -->
    <div>
      <label class="block text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-1.5" for="cl-signature">
        Sign-off
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="sig in SIGNATURES"
          :key="sig"
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200"
          :class="clData.signature === sig
            ? 'border-accent text-accent bg-accent/10'
            : 'border-overlay/10 text-secondary hover:text-primary hover:border-overlay/20'"
          @click="clData.signature = sig"
        >
          {{ sig }}
        </button>
      </div>
    </div>
  </div>
</template>
