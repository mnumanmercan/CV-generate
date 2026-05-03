<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter, RouterLink } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'
  import { TEMPLATES } from '@/components/templates/registry'

  const route            = useRoute()
  const router           = useRouter()
  const userStore        = useUserStore()
  const cvStore          = useCVStore()
  const { cvData } = storeToRefs(cvStore)

  const isBuilder = computed(() => route.name === 'builder')

  // Template picker state (only active on builder route)
  const activeId = computed(() => cvData.value.meta.templateId)
  const activeTemplate = computed(
    () => TEMPLATES.find((t) => t.id === activeId.value) ?? TEMPLATES[0],
  )

  function selectTemplate(id: string, isPro: boolean): void {
    if (isPro && !userStore.isPremium) {
      userStore.openUpgradeModal('Premium Templates')
      return
    }
    cvStore.setTemplate(id)
  }

  function onTemplateKeydown(event: KeyboardEvent): void {
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
    selectTemplate(t.id, t.isPro)
    const group = event.currentTarget as HTMLElement
    const buttons = group.querySelectorAll<HTMLElement>('[role="radio"]')
    buttons[next]?.focus()
  }

  function openCoverLetter(): void {
    if (userStore.isPremium) {
      router.push('/cover-letter')
    } else {
      userStore.openUpgradeModal('Cover Letter Generator')
    }
  }
</script>

<!--
  Sub-nav strip beneath AppHeader on the builder + cover-letter views.

  On the builder route the strip expands to also host the A4 format label and
  template radio group (previously a separate TemplatePicker toolbar), keeping
  all session-level controls in a single row and eliminating one toolbar layer.

  Layout (builder route):
    [◉ CV Builder] [✎ Cover Letter] | A4 · CLASSIC ··· [Classic] [Modern] [Technical]   [● Saved]

  Layout (other routes):
    [◉ CV Builder] [✎ Cover Letter]                                                        [● Saved]
-->
<template>
  <div
    class="flex items-center px-6 py-3 border-b border-overlay/8 shrink-0 min-w-0"
    style="background: var(--paper)"
  >
    <!-- Tabs -->
    <div
      class="flex items-center gap-1 shrink-0"
      role="tablist"
      aria-label="Builder tools"
    >
      <RouterLink
        to="/builder"
        role="tab"
        :aria-selected="route.name === 'builder'"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors"
        :class="route.name === 'builder'
          ? 'text-ink'
          : 'text-muted hover:text-ink'"
        :style="route.name === 'builder' ? { background: 'var(--card)' } : {}"
      >
        <span
          class="text-[14px] leading-none"
          :style="route.name === 'builder' ? { color: 'var(--accent)' } : {}"
          aria-hidden="true"
        >◉</span>
        CV Builder
      </RouterLink>

      <button
        type="button"
        role="tab"
        :aria-selected="route.name === 'cover-letter'"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors"
        :class="route.name === 'cover-letter'
          ? 'text-ink'
          : userStore.isPremium
            ? 'text-muted hover:text-ink'
            : 'text-muted/70 hover:text-muted'"
        :style="route.name === 'cover-letter' ? { background: 'var(--card)' } : {}"
        @click="openCoverLetter"
      >
        <span
          class="font-display italic text-[15px] leading-none"
          :style="route.name === 'cover-letter' ? { color: 'var(--accent)' } : {}"
          aria-hidden="true"
        >✎</span>
        Cover Letter
        <span
          v-if="!userStore.isPremium"
          class="mono-eyebrow text-[10px] px-2.5 py-[4px] rounded"
          :style="{ background: 'var(--accent)' }"
          aria-label="Pro feature"
        >Pro</span>
      </button>
    </div>

    <!-- Cover-letter: divider + static A4 · LETTER label (only when pro editor is visible) -->
    <template v-if="route.name === 'cover-letter' && userStore.isPremium">
      <div class="w-px h-4 mx-4 shrink-0 bg-overlay/15" aria-hidden="true" />
      <span class="mono-eyebrow text-[10.5px] text-muted shrink-0">A4 · LETTER</span>
    </template>

    <!-- Builder-only: vertical divider → A4 label → template radios (right-aligned) -->
    <template v-else-if="isBuilder">
      <div class="w-px h-4 mx-4 shrink-0 bg-overlay/15" aria-hidden="true" />

      <span class="mono-eyebrow text-[10.5px] text-muted shrink-0">
        A4 · {{ activeTemplate.name }}
      </span>

      <div
        class="flex items-center gap-1 ml-auto overflow-x-auto"
        role="radiogroup"
        aria-label="Resume template"
        @keydown="onTemplateKeydown"
      >
        <button
          v-for="template in TEMPLATES"
          :key="template.id"
          type="button"
          role="radio"
          :aria-checked="activeId === template.id"
          :tabindex="activeId === template.id ? 0 : -1"
          :aria-label="template.isPro && !userStore.isPremium
            ? `${template.name} (Pro plan required)`
            : template.name"
          :title="template.isPro && !userStore.isPremium
            ? `${template.description} (Pro plan required)`
            : template.description"
          :class="[
            'relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-medium transition-colors whitespace-nowrap',
            activeId === template.id
              ? 'text-white'
              : template.isPro && !userStore.isPremium
                ? 'text-muted/70 hover:text-muted hover:bg-overlay/5'
                : 'text-muted hover:text-ink hover:bg-overlay/5',
          ]"
          :style="activeId === template.id ? { background: 'var(--accent)' } : {}"
          @click="selectTemplate(template.id, template.isPro)"
        >
          {{ template.name }}
          <span
            v-if="template.isPro && !userStore.isPremium"
            class="mono-eyebrow text-[10px] px-2.5 py-[4px] rounded text-white"
            :style="{
              background: activeId === template.id ? 'rgba(255,255,255,0.28)' : 'var(--accent)',
            }"
          >Pro</span>
        </button>
      </div>
    </template>

  </div>
</template>
