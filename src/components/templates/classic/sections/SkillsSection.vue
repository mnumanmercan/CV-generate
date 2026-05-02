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
    style="margin-bottom: 12px;"
  >
    <h2 class="cv-section-heading">Skills</h2>
    <div
      v-for="(skill, index) in cvData.skills"
      :key="skill.id"
      :style="index > 0 ? 'margin-top: 3px;' : ''"
      style="font-size: 10.5px;"
    >
      <span style="font-weight: 700; color: #111827;">{{ skill.category }}: </span>
      <span style="color: #374151;">{{ skill.items.join(', ') }}</span>
    </div>
  </section>
</template>

<style scoped>
  .cv-section-heading {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #111827;
    border-bottom: 1.5px solid #d1d5db;
    padding-bottom: 5px;
    margin: 0 0 6px 0;
  }
</style>
