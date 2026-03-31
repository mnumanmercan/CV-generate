<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { TEMPLATES } from '@/components/templates/registry'

  const cvStore = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const activeId = computed(() => cvData.value.meta.templateId)

  function select(id: string): void {
    cvStore.setTemplate(id)
  }
</script>

<template>
  <div
    class="flex items-center justify-center gap-1 px-4 py-2 border-b border-overlay/5 shrink-0"
    style="background: var(--bg-surface)"
    role="group"
    aria-label="Resume template"
  >
    <button
      v-for="template in TEMPLATES"
      :key="template.id"
      type="button"
      :aria-pressed="activeId === template.id"
      :title="template.description"
      :class="[
        'px-3 py-1 rounded-full text-xs font-medium transition-colors',
        activeId === template.id
          ? 'bg-accent text-white'
          : 'text-secondary hover:text-primary hover:bg-overlay/5',
      ]"
      @click="select(template.id)"
    >
      {{ template.name }}
    </button>
  </div>
</template>
