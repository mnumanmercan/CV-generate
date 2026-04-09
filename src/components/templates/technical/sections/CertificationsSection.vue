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
    style="margin-bottom: 14px;"
  >
    <h2 class="cv-section-heading">// Certifications</h2>
    <div
      v-for="(cert, index) in cvData.certifications"
      :key="cert.id"
      :style="index > 0 ? 'margin-top: 5px;' : ''"
      style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10.5px;"
    >
      <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
        <span style="font-weight: 700; color: #0f172a;">{{ cert.name }}</span>
        <a
          v-if="cert.credentialUrl"
          :href="cert.credentialUrl"
          target="_blank"
          rel="noopener noreferrer"
          :title="cert.credentialUrl"
          style="display: inline-flex; align-items: center; flex-shrink: 0; color: #0891b2; text-decoration: none; line-height: 1;"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
        <span style="color: #475569;"> · {{ cert.issuer }}</span>
        <span v-if="cert.credentialId" style="color: #94a3b8; font-family: 'Courier New', Courier, monospace; font-size: 9.5px;"> · {{ cert.credentialId }}</span>
      </div>
      <p class="date-label" style="margin: 0 0 0 12px;">{{ cert.date }}</p>
    </div>
  </section>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    font-family: 'Courier New', Courier, monospace;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin: 0 0 8px 0;
    letter-spacing: 0.01em;
  }

  .date-label {
    font-size: 9.5px;
    font-family: 'Courier New', Courier, monospace;
    color: #94a3b8;
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
