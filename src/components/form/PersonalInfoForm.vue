<script setup lang="ts">
  import { reactive, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import FormField from './FormField.vue'
  import { validateEmail, validatePhone, validateUrl } from '@/services/atsFormatter'

  const cvStore = useCVStore()
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


</script>

<template>
  <div class="flex flex-col gap-4">
    <!--
      Profile photo upload — removed from form (ATS compliance: photos can
      cause parsing failures in ATS scanners). The profilePhoto field is
      preserved in cv.types.ts to avoid breaking stored-data migrations.

    <div>
      <span class="text-xs font-medium text-secondary font-mono uppercase tracking-wider flex items-center gap-1.5">
        Profile Photo
        <span v-if="!userStore.canUploadPhoto" ...>Pro</span>
      </span>
      <button type="button" ... @click="handlePhotoUploadClick">
        Upload photo (Phase 2)
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

      <!-- Job title color -->
      <div>
        <p class="mono-eyebrow text-[10.5px] text-muted mb-2">Title color</p>
        <div class="flex gap-5" role="radiogroup" aria-label="Job title color">
          <button
            type="button"
            class="flex items-center gap-2"
            role="radio"
            :aria-checked="(cvData.personal.jobTitleColor ?? 'accent') === 'accent'"
            @click="cvData.personal.jobTitleColor = 'accent'"
          >
            <span
              class="w-3.5 h-3.5 rounded-full shrink-0 transition-all"
              :style="(cvData.personal.jobTitleColor ?? 'accent') === 'accent'
                ? { background: '#B8532A', outline: '2px solid #B8532A', outlineOffset: '2px' }
                : { background: '#B8532A', outline: '1.5px solid rgba(0,0,0,0.12)', outlineOffset: '2px' }"
            />
            <span
              class="mono-eyebrow text-[10px] transition-colors"
              :class="(cvData.personal.jobTitleColor ?? 'accent') === 'accent' ? 'text-ink' : 'text-muted'"
            >Sienna</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-2"
            role="radio"
            :aria-checked="cvData.personal.jobTitleColor === 'dark'"
            @click="cvData.personal.jobTitleColor = 'dark'"
          >
            <span
              class="w-3.5 h-3.5 rounded-full shrink-0 transition-all"
              :style="cvData.personal.jobTitleColor === 'dark'
                ? { background: '#111827', outline: '2px solid #111827', outlineOffset: '2px' }
                : { background: '#111827', outline: '1.5px solid rgba(0,0,0,0.12)', outlineOffset: '2px' }"
            />
            <span
              class="mono-eyebrow text-[10px] transition-colors"
              :class="cvData.personal.jobTitleColor === 'dark' ? 'text-ink' : 'text-muted'"
            >Dark</span>
          </button>
        </div>
      </div>
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
