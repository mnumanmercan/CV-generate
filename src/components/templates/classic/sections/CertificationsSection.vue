<script setup lang="ts">
  import { computed } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'

  const props = defineProps<{
    cvData: CVData
    isPulsed: (section: SectionKey) => boolean
  }>()

  const hasCertifications = computed(() => props.cvData.certifications.length > 0)
</script>

<template>
  <section
    v-if="hasCertifications"
    :class="isPulsed('certifications') ? 'section-pulse' : ''"
    style="margin-bottom: 12px;"
  >
    <h2 class="cv-section-heading">Certifications</h2>
    <div
      v-for="(cert, index) in cvData.certifications"
      :key="cert.id"
      :style="index > 0 ? 'margin-top: 5px;' : ''"
      style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10.5px;"
    >
      <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
        <span style="font-weight: 700; color: #111827;">{{ cert.name }}</span>
        <a
          v-if="cert.credentialUrl"
          :href="cert.credentialUrl"
          target="_blank"
          rel="noopener noreferrer"
          :title="cert.credentialUrl"
          style="display: inline-flex; align-items: center; flex-shrink: 0; color: #B8532A; text-decoration: none; line-height: 1;"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
        <span style="color: #4b5563;"> | {{ cert.issuer }}</span>
        <span v-if="cert.credentialId" style="color: #6b7280;"> | ID: {{ cert.credentialId }}</span>
      </div>
      <span style="font-size: 10px; color: #6b7280; white-space: nowrap; margin-left: 12px; flex-shrink: 0;">
        {{ cert.date }}
      </span>
    </div>
  </section>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #111827;
    border-bottom: 1.5px solid #d1d5db;
    padding-bottom: 3px;
    margin: 0 0 6px 0;
  }
</style>
