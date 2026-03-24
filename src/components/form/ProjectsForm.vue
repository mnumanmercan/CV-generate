<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createProject } from '@/types/cv.types'
  import { validateUrl } from '@/services/atsFormatter'

  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.projects))
  const techInputs = ref<Record<string, string>>({})

  function addProject(): void {
    const project = createProject()
    cvData.value.projects.push(project)
    techInputs.value[project.id] = ''
  }

  function removeProject(index: number): void {
    cvData.value.projects.splice(index, 1)
  }

  function addTech(projectId: string, index: number): void {
    const input = (techInputs.value[projectId] ?? '').trim()
    if (!input) return
    const project = cvData.value.projects[index]
    if (project && !project.techStack.includes(input)) {
      project.techStack.push(input)
    }
    techInputs.value[projectId] = ''
  }

  function removeTech(projectIndex: number, techIndex: number): void {
    cvData.value.projects[projectIndex]?.techStack.splice(techIndex, 1)
  }

  function onTechKeydown(event: KeyboardEvent, projectId: string, index: number): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTech(projectId, index)
    }
  }

  function getLinkError(link: string | undefined): string {
    if (!link) return ''
    return validateUrl(link) ? '' : 'URL must start with https://'
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(project, index) in cvData.projects"
      :key="project.id"
      :class="[
        'rounded-xl border p-4 transition-all',
        drag.isDragging(project.id) ? 'dragging border-white/5' : '',
        drag.isDragOver(project.id) ? 'drag-over' : 'border-white/5',
      ]"
      draggable="true"
      :aria-label="`Project entry ${index + 1}`"
      @dragstart="drag.onDragStart(project.id)"
      @dragover.prevent="drag.onDragOver(project.id)"
      @drop="drag.onDrop(project.id)"
      @dragend="drag.onDragEnd"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-secondary cursor-grab" aria-hidden="true">⠿</span>
          <span class="text-sm font-semibold text-primary">
            {{ project.name || `Project ${index + 1}` }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`Remove project ${index + 1}`"
          @click="removeProject(index)"
        >
          Remove
        </button>
      </div>

      <div class="flex flex-col gap-3">
        <FormField
          :id="`project-name-${project.id}`"
          v-model="project.name"
          label="Project Name"
          placeholder="Open Source CV Builder"
          required
        />
        <FormField
          :id="`project-desc-${project.id}`"
          v-model="project.description"
          label="Description"
          type="textarea"
          placeholder="Built a full-stack CV builder with real-time preview..."
          required
        />
        <FormField
          :id="`project-link-${project.id}`"
          v-model="project.link"
          label="Project URL (optional)"
          type="url"
          placeholder="https://github.com/you/project"
          :error="getLinkError(project.link)"
        />

        <!-- Tech stack chips -->
        <div>
          <p class="text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-2">
            Tech Stack
          </p>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <span
              v-for="(tech, tIdx) in project.techStack"
              :key="tIdx"
              class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-secondary text-xs border border-white/10 animate-chip-in"
            >
              {{ tech }}
              <button
                type="button"
                class="hover:text-primary transition-colors"
                :aria-label="`Remove tech ${tech}`"
                @click="removeTech(index, tIdx)"
              >×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              :id="`tech-input-${project.id}`"
              v-model="techInputs[project.id]"
              type="text"
              placeholder="Vue, TypeScript, Node..."
              class="flex-1 px-3 py-2 text-sm rounded-lg"
              :aria-label="`Add tech to ${project.name || 'project'}`"
              @keydown="onTechKeydown($event, project.id, index)"
            />
            <button
              type="button"
              class="px-3 py-2 rounded-lg bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-colors"
              @click="addTech(project.id, index)"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-white/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addProject"
    >
      <span aria-hidden="true">+</span> Add Project
    </button>
  </div>
</template>
