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
      <div>
        <span style="font-weight: 700; color: #111827;">{{ cert.name }}</span>
        <span style="color: #4b5563;"> · {{ cert.issuer }}</span>
        <span v-if="cert.credentialId" style="color: #6b7280;"> · ID: {{ cert.credentialId }}</span>
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
    letter-spacing: 0.10em;
    color: #111827;
    border-bottom: 1.5px solid #d1d5db;
    padding-bottom: 3px;
    margin: 0 0 6px 0;
  }
</style>
