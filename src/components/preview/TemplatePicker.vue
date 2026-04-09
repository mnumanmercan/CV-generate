<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useUserStore } from '@/stores/userStore'
  import { TEMPLATES } from '@/components/templates/registry'

  const cvStore = useCVStore()
  const userStore = useUserStore()
  const { cvData } = storeToRefs(cvStore)

  const activeId = computed(() => cvData.value.meta.templateId)

  function select(id: string, isPro: boolean): void {
    if (isPro && !userStore.isPremium) {
      userStore.openUpgradeModal('Premium Templates')
      return
    }
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
      :title="template.isPro && !userStore.isPremium ? `${template.description} (Pro plan required)` : template.description"
      :class="[
        'relative flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all',
        activeId === template.id
          ? 'bg-accent text-white'
          : template.isPro && !userStore.isPremium
            ? 'text-secondary/50 hover:text-secondary hover:bg-overlay/5'
            : 'text-secondary hover:text-primary hover:bg-overlay/5',
      ]"
      @click="select(template.id, template.isPro)"
    >
      {{ template.name }}
      <span
        v-if="template.isPro && !userStore.isPremium"
        class="text-[9px] font-bold px-1 py-px rounded-full text-white leading-none"
        style="background: linear-gradient(135deg, #0891B2, #0D9488)"
      >Pro</span>
    </button>
  </div>
</template>
