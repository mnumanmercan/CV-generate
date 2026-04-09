<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import { useCVStore } from '@/stores/cvStore'
  import FormField from '@/components/form/FormField.vue'

  const coverLetterStore = useCoverLetterStore()
  const cvStore = useCVStore()
  const { clData } = storeToRefs(coverLetterStore)
  const { cvData } = storeToRefs(cvStore)

  function syncFromCV(): void {
    coverLetterStore.populateFromCV(cvData.value.personal)
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Sync button -->
    <button
      type="button"
      class="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-overlay/10 text-secondary hover:text-primary hover:border-overlay/20 transition-all"
      @click="syncFromCV"
    >
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Sync from CV
    </button>

    <div class="grid grid-cols-1 gap-3">
      <FormField
        id="cl-fullName"
        v-model="clData.fullName"
        label="Full Name"
        placeholder="Jane Doe"
        autocomplete="name"
        required
      />
      <FormField
        id="cl-jobTitle"
        v-model="clData.jobTitle"
        label="Job Title"
        placeholder="Senior Software Engineer"
        autocomplete="organization-title"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <FormField
        id="cl-email"
        v-model="clData.email"
        label="Email"
        type="email"
        placeholder="jane@example.com"
        autocomplete="email"
        required
      />
      <FormField
        id="cl-phone"
        v-model="clData.phone"
        label="Phone"
        type="tel"
        placeholder="+1 555 000 0000"
        autocomplete="tel"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <FormField
        id="cl-location"
        v-model="clData.location"
        label="Location"
        placeholder="New York, NY"
        autocomplete="address-level2"
      />
      <FormField
        id="cl-date"
        v-model="clData.date"
        label="Letter Date"
        placeholder="April 9, 2026"
      />
    </div>
  </div>
</template>
