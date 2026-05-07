<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import FormField from '@/components/form/FormField.vue'
  import { useI18n } from '@/composables/useI18n'

  const { t, t_obj } = useI18n()
  const coverLetterStore = useCoverLetterStore()
  const { clData } = storeToRefs(coverLetterStore)

  const signatures = computed(() => t_obj<string[]>('coverLetter.signatures'))
</script>

<template>
  <div class="flex flex-col gap-5">
    <FormField
      id="cl-opening"
      v-model="clData.opening"
      :label="t('coverLetter.contentOpening')"
      type="textarea"
      placeholder="I am writing to express my interest in the [Role] position at [Company]…"
      :hint="t('coverLetter.contentOpeningHint')"
    />

    <FormField
      id="cl-bodyWhy"
      v-model="clData.bodyWhy"
      :label="t('coverLetter.contentBodyWhy')"
      type="textarea"
      placeholder="I am particularly drawn to [Company] because…"
      :hint="t('coverLetter.contentBodyWhyHint')"
    />

    <FormField
      id="cl-bodyBring"
      v-model="clData.bodyBring"
      :label="t('coverLetter.contentBodyBring')"
      type="textarea"
      placeholder="In my previous role at [Company], I led…"
      :hint="t('coverLetter.contentBodyBringHint')"
    />

    <FormField
      id="cl-closing"
      v-model="clData.closing"
      :label="t('coverLetter.contentClosing')"
      type="textarea"
      placeholder="I would welcome the opportunity to discuss how my background…"
      :hint="t('coverLetter.contentClosingHint')"
    />

    <!-- Signature selector -->
    <div>
      <label class="block text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-1.5" for="cl-signature">
        {{ t('coverLetter.contentSignOff') }}
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="sig in signatures"
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
