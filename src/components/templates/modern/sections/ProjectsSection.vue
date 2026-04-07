<script setup lang="ts">
  import { computed } from 'vue'
  import type { CVData, SectionKey } from '@/types/cv.types'

  const props = defineProps<{
    cvData: CVData
    isPulsed: (section: SectionKey) => boolean
  }>()

  const hasProjects = computed(() => props.cvData.projects.length > 0)
</script>

<template>
  <section
    v-if="hasProjects"
    :class="isPulsed('projects') ? 'section-pulse' : ''"
    style="margin-bottom: 18px;"
  >
    <h2 class="cv-section-heading">Projects</h2>
    <div
      v-for="(project, index) in cvData.projects"
      :key="project.id"
      :style="index > 0 ? 'margin-top: 12px;' : ''"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <p style="font-size: 11.5px; font-weight: 700; color: #111827; margin: 0;">{{ project.name }}</p>
        <p v-if="project.link" style="font-size: 10px; color: #0891b2; white-space: nowrap; margin: 0 0 0 12px; flex-shrink: 0;">
          {{ project.link.replace('https://', '') }}
        </p>
      </div>
      <p style="font-size: 10.5px; color: #374151; margin: 3px 0 4px 0; line-height: 1.6;">{{ project.description }}</p>
      <div v-if="project.techStack.length" style="display: flex; flex-wrap: wrap; gap: 3px;">
        <span
          v-for="tech in project.techStack"
          :key="tech"
          class="skill-chip"
        >
          {{ tech }}
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
    border-left: 3px solid #0891b2;
    padding-left: 8px;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .skill-chip {
    display: inline-block;
    font-size: 9.5px;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 3px;
    padding: 1px 6px;
  }
</style>
