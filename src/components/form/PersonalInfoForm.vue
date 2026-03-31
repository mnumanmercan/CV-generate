<script setup lang="ts">
  import { reactive, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useUserStore } from '@/stores/userStore'
  import FormField from './FormField.vue'
  import { validateEmail, validatePhone, validateUrl } from '@/services/atsFormatter'

  const cvStore = useCVStore()
  const userStore = useUserStore()
  const { cvData } = storeToRefs(cvStore)

  const errors = reactive<Record<string, string>>({})

  function validateField(field: string): void {
    const p = cvData.value.personal
    switch (field) {
      case 'fullName':
        errors.fullName = p.fullName.trim() ? '' : 'Full name is required.'
        break
      case 'jobTitle':
        errors.jobTitle = p.jobTitle.trim() ? '' : 'Job title is required.'
        break
      case 'email':
        errors.email = validateEmail(p.email) ? '' : 'Enter a valid email address.'
        break
      case 'phone':
        errors.phone = validatePhone(p.phone) ? '' : 'Enter a valid phone number.'
        break
      case 'location':
        errors.location = p.location.trim() ? '' : 'Location is required.'
        break
      case 'linkedin':
        errors.linkedin =
          !p.linkedin || validateUrl(p.linkedin) ? '' : 'URL must start with https://'
        break
      case 'github':
        errors.github =
          !p.github || validateUrl(p.github) ? '' : 'URL must start with https://'
        break
      case 'website':
        errors.website =
          !p.website || validateUrl(p.website) ? '' : 'URL must start with https://'
        break
    }
  }

  const isComplete = computed(
    () =>
      cvData.value.personal.fullName &&
      cvData.value.personal.email &&
      cvData.value.personal.phone &&
      cvData.value.personal.location &&
      cvData.value.personal.jobTitle,
  )

  function handlePhotoUploadClick(): void {
    if (!userStore.canUploadPhoto) {
      userStore.openUpgradeModal('Profile Photo Upload')
    }
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Profile photo (premium-gated) — temporarily hidden -->
    <!--
    <div>
      <span class="text-xs font-medium text-secondary font-mono uppercase tracking-wider">
        Profile Photo
        <span class="ml-1 px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent font-mono">PRO</span>
      </span>
      <button
        type="button"
        class="mt-1.5 w-full h-20 rounded-xl border-2 border-dashed border-overlay/10 flex flex-col items-center justify-center gap-1 text-secondary hover:border-accent/50 hover:text-accent transition-colors cursor-pointer"
        aria-label="Upload profile photo (Pro feature)"
        @click="handlePhotoUploadClick"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span class="text-xs">Click to upload (Pro)</span>
      </button>
    </div>
    -->

    <!-- Required fields -->
    <div class="grid grid-cols-1 gap-3">
      <FormField
        id="fullName"
        v-model="cvData.personal.fullName"
        label="Full Name"
        placeholder="Jane Doe"
        autocomplete="name"
        required
        :error="errors.fullName"
        @blur="validateField('fullName')"
      />
      <FormField
        id="jobTitle"
        v-model="cvData.personal.jobTitle"
        label="Job Title"
        placeholder="Senior Software Engineer"
        autocomplete="organization-title"
        required
        :error="errors.jobTitle"
        @blur="validateField('jobTitle')"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <FormField
        id="email"
        v-model="cvData.personal.email"
        label="Email"
        type="email"
        placeholder="jane@example.com"
        autocomplete="email"
        required
        :error="errors.email"
        @blur="validateField('email')"
      />
      <FormField
        id="phone"
        v-model="cvData.personal.phone"
        label="Phone"
        type="tel"
        placeholder="+1 555 000 0000"
        autocomplete="tel"
        required
        :error="errors.phone"
        @blur="validateField('phone')"
      />
    </div>

    <FormField
      id="location"
      v-model="cvData.personal.location"
      label="Location"
      placeholder="New York, NY"
      autocomplete="address-level2"
      required
      :error="errors.location"
      @blur="validateField('location')"
    />

    <!-- Optional URLs -->
    <div class="pt-1 border-t border-overlay/5">
      <p class="text-xs text-secondary mb-3">Optional links (must start with https://)</p>
      <div class="flex flex-col gap-3">
        <FormField
          id="linkedin"
          v-model="cvData.personal.linkedin"
          label="LinkedIn"
          type="url"
          placeholder="https://linkedin.com/in/janedoe"
          autocomplete="url"
          :error="errors.linkedin"
          @blur="validateField('linkedin')"
        />
        <FormField
          id="github"
          v-model="cvData.personal.github"
          label="GitHub"
          type="url"
          placeholder="https://github.com/janedoe"
          autocomplete="url"
          :error="errors.github"
          @blur="validateField('github')"
        />
        <FormField
          id="website"
          v-model="cvData.personal.website"
          label="Website"
          type="url"
          placeholder="https://janedoe.dev"
          autocomplete="url"
          :error="errors.website"
          @blur="validateField('website')"
        />
      </div>
    </div>

    <!-- Completion indicator -->
    <div
      v-if="isComplete"
      class="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg"
      role="status"
    >
      <span aria-hidden="true">✓</span> Personal info complete
    </div>
  </div>
</template>
