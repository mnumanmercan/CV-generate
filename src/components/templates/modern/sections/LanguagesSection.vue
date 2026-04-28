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
    style="margin-bottom: 18px;"
  >
    <h2 class="cv-section-heading">Languages</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 8px 18px;">
      <div
        v-for="lang in cvData.languages"
        :key="lang.id"
        style="font-size: 10px;"
      >
        <span style="font-weight: 700; color: #374151;">{{ lang.name }}</span>
        <span
          v-if="lang.proficiency"
          style="color: #B8532A; margin-left: 6px; font-size: 9.5px;"
        >· {{ lang.proficiency }}</span>
      </div>
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
    border-left: 3px solid #B8532A;
    padding-left: 8px;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }
</style>
