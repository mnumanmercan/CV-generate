<script setup lang="ts">
  import { computed } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'

  const props = defineProps<{
    cvData: CVData
    isPulsed: (section: SectionKey) => boolean
  }>()

  const hasLanguages = computed(() => props.cvData.languages.length > 0)
</script>

<template>
  <section
    v-if="hasLanguages"
    :class="isPulsed('languages') ? 'section-pulse' : ''"
    style="margin-bottom: 12px;"
  >
    <h2 class="cv-section-heading">Languages</h2>
    <div
      v-for="(lang, index) in cvData.languages"
      :key="lang.id"
      :style="index > 0 ? 'margin-top: 3px;' : ''"
      style="font-size: 10.5px;"
    >
      <span style="font-weight: 700; color: #111827;">{{ lang.name }}</span>
      <span v-if="lang.proficiency" style="color: #374151;"> — {{ lang.proficiency }}</span>
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
