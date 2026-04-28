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
    style="margin-bottom: 14px;"
  >
    <h2 class="cv-section-heading">// Languages</h2>
    <div
      v-for="(lang, index) in cvData.languages"
      :key="lang.id"
      :style="index > 0 ? 'margin-top: 4px;' : ''"
      style="display: flex; align-items: baseline; gap: 8px;"
    >
      <span class="lang-name">{{ lang.name }}</span>
      <span v-if="lang.proficiency" class="lang-prof">{{ lang.proficiency }}</span>
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

  .lang-name {
    font-size: 10px;
    font-weight: 700;
    font-family: 'Courier New', Courier, monospace;
    color: #0f172a;
    min-width: 110px;
  }

  .lang-prof {
    font-size: 9.5px;
    font-family: 'Courier New', Courier, monospace;
    color: #64748b;
  }
</style>
