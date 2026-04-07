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
    style="margin-bottom: 14px;"
  >
    <h2 class="cv-section-heading">// Projects</h2>
    <div
      v-for="(project, index) in cvData.projects"
      :key="project.id"
      :style="index > 0 ? 'margin-top: 10px;' : ''"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <p style="font-size: 11.5px; font-weight: 700; color: #0f172a; margin: 0;">{{ project.name }}</p>
        <a
          v-if="project.link"
          :href="project.link"
          target="_blank"
          rel="noopener noreferrer"
          style="font-size: 9.5px; color: #0891b2; white-space: nowrap; margin: 0 0 0 12px; flex-shrink: 0; font-family: 'Courier New', Courier, monospace; text-decoration: none;"
        >
          {{ project.link.replace('https://', '') }}
        </a>
      </div>
      <p style="font-size: 10.5px; color: #334155; margin: 3px 0 4px 0; line-height: 1.55;">{{ project.description }}</p>
      <div v-if="project.techStack.length" style="display: flex; flex-wrap: wrap; gap: 3px;">
        <span
          v-for="tech in project.techStack"
          :key="tech"
          class="tech-chip"
        >
          {{ tech }}
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
</style>
