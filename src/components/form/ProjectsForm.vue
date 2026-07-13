<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useDragSort } from '@/composables/useDragSort'
  import FormField from './FormField.vue'
  import { createProject } from '@/types/cv.types'
  import { validateUrl } from '@/services/atsFormatter'
  import { useI18n } from '@/composables/useI18n'
  import { CV_LIMITS } from '@resumark/shared'

  const { t } = useI18n()
  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const drag = useDragSort(computed(() => cvData.value.projects))
  const techInputs = ref<Record<string, string>>({})

  const projectLimitReached = computed(
    () => cvData.value.projects.length >= CV_LIMITS.projects.maxItems,
  )

  function techLimitReached(index: number): boolean {
    return (cvData.value.projects[index]?.techStack.length ?? 0) >= CV_LIMITS.projects.maxTech
  }

  function addProject(): void {
    if (projectLimitReached.value) return
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
    if (techLimitReached(index)) return
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
    return validateUrl(link) ? '' : t('forms.errorUrlHttps')
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(project, index) in cvData.projects"
      :key="project.id"
      :class="[
        'rounded-xl border p-4 transition-all',
        drag.isDragging(project.id) ? 'dragging border-overlay/5' : '',
        drag.isDragOver(project.id) ? 'drag-over' : 'border-overlay/5',
      ]"
      draggable="true"
      :aria-label="t('forms.projectEntryLabel', { n: String(index + 1) })"
      @dragstart="drag.onDragStart(project.id)"
      @dragover.prevent="drag.onDragOver(project.id)"
      @drop="drag.onDrop(project.id)"
      @dragend="drag.onDragEnd"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-secondary cursor-grab" role="img" :aria-label="t('forms.dragToReorder')"
            >⠿</span
          >
          <span class="text-sm font-semibold text-primary">
            {{ project.name || t('forms.projectEntryLabel', { n: String(index + 1) }) }}
          </span>
        </div>
        <button
          type="button"
          class="text-secondary hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
          :aria-label="`${t('forms.remove')} ${t('forms.projectEntryLabel', { n: String(index + 1) })}`"
          @click="removeProject(index)"
        >
          {{ t('forms.remove') }}
        </button>
      </div>

      <div class="flex flex-col gap-3">
        <FormField
          :id="`project-name-${project.id}`"
          v-model="project.name"
          :label="t('forms.projectName')"
          placeholder="Open Source CV Builder"
          required
          :maxlength="CV_LIMITS.projects.name"
        />
        <FormField
          :id="`project-desc-${project.id}`"
          v-model="project.description"
          :label="t('forms.projectDesc')"
          type="textarea"
          placeholder="Built a full-stack CV builder with real-time preview..."
          required
          :maxlength="CV_LIMITS.projects.description"
        />
        <FormField
          :id="`project-link-${project.id}`"
          v-model="project.link"
          :label="t('forms.projectUrl')"
          type="url"
          placeholder="https://github.com/you/project"
          :maxlength="CV_LIMITS.projects.link"
          :error="getLinkError(project.link)"
        />

        <!-- Tech stack chips -->
        <div>
          <p class="text-xs font-medium text-secondary font-mono uppercase tracking-wider mb-2">
            {{ t('forms.techStack') }}
          </p>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <span
              v-for="(tech, tIdx) in project.techStack"
              :key="tIdx"
              class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-secondary text-xs border border-overlay/10 animate-chip-in"
            >
              {{ tech }}
              <button
                type="button"
                class="hover:text-primary transition-colors"
                :aria-label="`Remove tech ${tech}`"
                @click="removeTech(index, tIdx)"
              >
                ×
              </button>
            </span>
          </div>
          <div v-if="!techLimitReached(index)" class="flex gap-2">
            <input
              :id="`tech-input-${project.id}`"
              v-model="techInputs[project.id]"
              type="text"
              :maxlength="CV_LIMITS.projects.techItem"
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
              {{ t('forms.addTech') }}
            </button>
          </div>
          <p v-else class="text-xs text-secondary">
            {{ t('forms.limitReached', { n: String(CV_LIMITS.projects.maxTech) }) }}
          </p>
        </div>
      </div>
    </div>

    <button
      v-if="!projectLimitReached"
      type="button"
      class="w-full py-3 rounded-xl border-2 border-dashed border-overlay/10 text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2"
      @click="addProject"
    >
      <span aria-hidden="true">+</span> {{ t('forms.addProject') }}
    </button>
    <p v-else class="text-center text-xs text-secondary py-2">
      {{ t('forms.limitReached', { n: String(CV_LIMITS.projects.maxItems) }) }}
    </p>
  </div>
</template>
