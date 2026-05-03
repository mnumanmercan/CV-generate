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
  const activeTemplate = computed(
    () => TEMPLATES.find((t) => t.id === activeId.value) ?? TEMPLATES[0],
  )

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

<!--
  Preview-pane top toolbar. On the left, a mono eyebrow announces what
  format we're previewing ("A4 · CLASSIC"); on the right, three pill radios
  to swap templates. Pro templates wear a small sienna 'Pro' chip and route
  through the upgrade modal when clicked by a free-tier user.
-->
<template>
  <div
    class="flex items-center justify-between gap-4 px-5 py-3 border-b border-overlay/8 shrink-0"
    style="background: var(--paper)"
    @keydown="onKeydown"
  >
    <!-- Format + active template label -->
    <span class="mono-eyebrow shrink-0">
      A4 · {{ activeTemplate.name }}
    </span>

    <!-- Template radios -->
    <div
      class="flex items-center gap-1 overflow-x-auto"
      role="radiogroup"
      aria-label="Resume template"
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
          'relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-medium transition-colors whitespace-nowrap',
          activeId === template.id
            ? 'text-white'
            : template.isPro && !userStore.isPremium
              ? 'text-muted/70 hover:text-muted hover:bg-overlay/5'
              : 'text-muted hover:text-ink hover:bg-overlay/5',
        ]"
        :style="activeId === template.id ? { background: 'var(--accent)' } : {}"
        @click="select(template.id, template.isPro)"
      >
        {{ template.name }}
        <span
          v-if="template.isPro && !userStore.isPremium"
          class="mono-eyebrow rounded leading-none"
          :style="{
            fontSize: '8.5px',
            fontWeight: '700',
            padding: '2px 6px',
            color: '#ffffff',
            background: activeId === template.id ? 'rgba(255,255,255,0.28)' : 'var(--accent)',
          }"
        >Pro</span>
      </button>
    </div>
  </div>
</template>
