<script setup lang="ts">
  import { computed } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'

  const props = defineProps<{
    cvData: CVData
    isPulsed: (section: SectionKey) => boolean
  }>()

  const hasSkills = computed(() => props.cvData.skills.length > 0)
</script>

<template>
  <section
    v-if="hasSkills"
    :class="isPulsed('skills') ? 'section-pulse' : ''"
    style="margin-bottom: 14px;"
  >
    <h2 class="cv-section-heading">// Skills</h2>
    <div
      v-for="(skill, index) in cvData.skills"
      :key="skill.id"
      :style="index > 0 ? 'margin-top: 5px;' : ''"
      style="display: flex; align-items: flex-start; gap: 8px;"
    >
      <span class="skill-category-label">{{ skill.category }}</span>
      <div style="display: flex; flex-wrap: wrap; gap: 3px; flex: 1;">
        <span
          v-for="item in skill.items"
          :key="item"
          class="tech-chip"
        >
          {{ item }}
        </span>
      </div>
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

  .tech-chip {
    display: inline-block;
    font-size: 9px;
    font-family: 'Courier New', Courier, monospace;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 2px;
    padding: 1px 5px;
    color: #374151;
  }

  .skill-category-label {
    font-size: 9.5px;
    font-weight: 700;
    font-family: 'Courier New', Courier, monospace;
    color: #0f172a;
    white-space: nowrap;
    min-width: 110px;
    padding-top: 2px;
  }
</style>
