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
    style="margin-bottom: 18px;"
  >
    <h2 class="cv-section-heading">Certifications</h2>
    <div
      v-for="(cert, index) in cvData.certifications"
      :key="cert.id"
      :style="index > 0 ? 'margin-top: 6px;' : ''"
      style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10.5px;"
    >
      <div>
        <span style="font-weight: 700; color: #111827;">{{ cert.name }}</span>
        <span style="color: #64748b;"> · {{ cert.issuer }}</span>
        <span v-if="cert.credentialId" style="color: #94a3b8;"> · ID: {{ cert.credentialId }}</span>
      </div>
      <span style="font-size: 10px; color: #94a3b8; white-space: nowrap; margin-left: 12px; flex-shrink: 0;">
        {{ cert.date }}
      </span>
    </div>
  </section>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #94a3b8;
    border-left: 3px solid #0891b2;
    padding-left: 8px;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }
</style>
