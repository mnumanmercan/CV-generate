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
    style="margin-bottom: 18px;"
  >
    <h2 class="cv-section-heading">Skills</h2>
    <div
      v-for="(skill, index) in cvData.skills"
      :key="skill.id"
      :style="index > 0 ? 'margin-top: 5px;' : ''"
      style="display: flex; align-items: flex-start; gap: 6px; flex-wrap: wrap;"
    >
      <span style="font-size: 10px; font-weight: 700; color: #374151; white-space: nowrap; padding-top: 1px;">
        {{ skill.category }}:
      </span>
      <div style="display: flex; flex-wrap: wrap; gap: 3px;">
        <span
          v-for="item in skill.items"
          :key="item"
          class="skill-chip"
        >
          {{ item }}
        </span>
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

  .skill-chip {
    display: inline-block;
    font-size: 9.5px;
    background: #FBE9DC;
    color: #8B3D1A;
    border-radius: 3px;
    padding: 1px 6px;
  }
</style>
