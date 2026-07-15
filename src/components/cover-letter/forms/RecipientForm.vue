<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import FormField from '@/components/form/FormField.vue'
  import { useI18n } from '@/composables/useI18n'

  const { t } = useI18n()
  const coverLetterStore = useCoverLetterStore()
  const { clData } = storeToRefs(coverLetterStore)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField
        id="cl-recipientName"
        v-model="clData.recipientName"
        :label="t('coverLetter.recipientName')"
        placeholder="Sarah Johnson"
      />
      <FormField
        id="cl-recipientTitle"
        v-model="clData.recipientTitle"
        :label="t('coverLetter.recipientTitle')"
        placeholder="Hiring Manager"
      />
    </div>

    <FormField
      id="cl-companyName"
      v-model="clData.companyName"
      :label="t('coverLetter.recipientCompany')"
      placeholder="Acme Corp"
      required
    />

    <FormField
      id="cl-companyAddress"
      v-model="clData.companyAddress"
      :label="t('coverLetter.recipientAddress')"
      type="textarea"
      placeholder="123 Main Street&#10;New York, NY 10001"
    />

    <FormField
      id="cl-targetJobDescription"
      v-model="clData.targetJobDescription"
      :label="t('coverLetter.targetJobDescription')"
      type="textarea"
      :placeholder="t('coverLetter.targetJobDescriptionPlaceholder')"
      :hint="t('coverLetter.targetJobDescriptionHint')"
      :maxlength="5000"
    />
  </div>
</template>
