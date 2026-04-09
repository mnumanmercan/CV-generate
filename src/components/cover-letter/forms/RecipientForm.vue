<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import FormField from '@/components/form/FormField.vue'

  const coverLetterStore = useCoverLetterStore()
  const { clData } = storeToRefs(coverLetterStore)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-3">
      <FormField
        id="cl-recipientName"
        v-model="clData.recipientName"
        label="Recipient Name"
        placeholder="Sarah Johnson"
      />
      <FormField
        id="cl-recipientTitle"
        v-model="clData.recipientTitle"
        label="Recipient Title"
        placeholder="Hiring Manager"
      />
    </div>

    <FormField
      id="cl-companyName"
      v-model="clData.companyName"
      label="Company Name"
      placeholder="Acme Corp"
      required
    />

    <FormField
      id="cl-companyAddress"
      v-model="clData.companyAddress"
      label="Company Address"
      type="textarea"
      placeholder="123 Main Street&#10;New York, NY 10001"
    />
  </div>
</template>
