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

  function onKeydown(event: KeyboardEvent): void {
    const idx = TEMPLATES.findIndex((t) => t.id === activeId.value)
    let next = idx
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      next = (idx + 1) % TEMPLATES.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      next = (idx - 1 + TEMPLATES.length) % TEMPLATES.length
    } else {
      return
    }
    const t = TEMPLATES[next]
    select(t.id, t.isPro)
    // Move focus to the newly active button.
    const group = (event.currentTarget as HTMLElement)
    const buttons = group.querySelectorAll<HTMLElement>('[role="radio"]')
    buttons[next]?.focus()
  }
</script>

<template>
  <div
    class="flex items-center justify-center gap-1 px-4 py-2 border-b border-overlay/5 shrink-0"
    style="background: var(--bg-surface)"
    role="radiogroup"
    aria-label="Resume template"
    @keydown="onKeydown"
  >
    <button
      v-for="template in TEMPLATES"
      :key="template.id"
      type="button"
      role="radio"
      :aria-checked="activeId === template.id"
      :tabindex="activeId === template.id ? 0 : -1"
      :aria-label="template.isPro && !userStore.isPremium ? `${template.name} (Pro plan required)` : template.name"
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
