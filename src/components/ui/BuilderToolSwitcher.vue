<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useRoute, RouterLink } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'
  import { useI18n } from '@/composables/useI18n'
  import { TEMPLATES } from '@/components/templates/registry'

  const route            = useRoute()
  const userStore        = useUserStore()
  const cvStore          = useCVStore()
  const { cvData } = storeToRefs(cvStore)
  const { t } = useI18n()

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

  // Mobile dropdown: tap-trigger that opens a popover listing all templates.
  const mobileMenuOpen = ref(false)
  const mobileMenuRef  = ref<HTMLElement | null>(null)

  function toggleMobileMenu(): void {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }

  function selectFromMenu(id: string, isPro: boolean): void {
    selectTemplate(id, isPro)
    if (!(isPro && !userStore.isPremium)) {
      mobileMenuOpen.value = false
    }
  }

  function onDocClick(e: MouseEvent): void {
    if (!mobileMenuOpen.value) return
    if (mobileMenuRef.value && !mobileMenuRef.value.contains(e.target as Node)) {
      mobileMenuOpen.value = false
    }
  }
  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && mobileMenuOpen.value) mobileMenuOpen.value = false
  }
  onMounted(() => {
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeydown)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onKeydown)
  })

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
    class="flex items-center px-4 md:px-6 py-2.5 md:py-3 border-b border-overlay/8 shrink-0 min-w-0"
    style="background: var(--paper)"
  >
    <!-- Tabs -->
    <div
      class="flex items-center gap-1 shrink-0"
      role="tablist"
      :aria-label="t('aria.builderTools')"
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
        {{ t('nav.builder') }}
      </RouterLink>

      <RouterLink
        to="/cover-letter"
        role="tab"
        :aria-selected="route.name === 'cover-letter'"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors"
        :class="route.name === 'cover-letter'
          ? 'text-ink'
          : 'text-muted hover:text-ink'"
        :style="route.name === 'cover-letter' ? { background: 'var(--card)' } : {}"
      >
        <span
          class="font-display italic text-[15px] leading-none"
          :style="route.name === 'cover-letter' ? { color: 'var(--accent)' } : {}"
          aria-hidden="true"
        >✎</span>
        {{ t('nav.coverLetter') }}
      </RouterLink>
    </div>

    <!-- Cover-letter: divider + static A4 · LETTER label (desktop only) -->
    <template v-if="route.name === 'cover-letter'">
      <div class="hidden md:block w-px h-4 mx-4 shrink-0 bg-overlay/15" aria-hidden="true" />
      <span class="hidden md:inline mono-eyebrow text-[10.5px] text-muted shrink-0">A4 · LETTER</span>
    </template>

    <!-- Builder-only: vertical divider → A4 label → template radios (right-aligned) -->
    <template v-else-if="isBuilder">
      <div class="hidden md:block w-px h-4 mx-4 shrink-0 bg-overlay/15" aria-hidden="true" />

      <span class="hidden md:inline mono-eyebrow text-[10.5px] text-muted shrink-0">
        A4 · {{ activeTemplate.name }}
      </span>

      <!-- Desktop radiogroup: pills (md+) -->
      <div
        class="hidden md:flex items-center gap-1 ml-auto overflow-x-auto min-w-0"
        role="radiogroup"
        :aria-label="t('builder.resumeTemplate')"
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
            ? t('builder.proRequired', { name: template.name })
            : template.name"
          :title="template.isPro && !userStore.isPremium
            ? t('builder.proRequired', { name: template.description })
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

      <!-- Mobile template dropdown (below md) -->
      <div ref="mobileMenuRef" class="md:hidden relative ml-auto shrink-0">
        <button
          type="button"
          class="flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
          :style="{ background: 'var(--accent)' }"
          :aria-label="t('builder.resumeTemplate')"
          :aria-expanded="mobileMenuOpen"
          aria-haspopup="menu"
          @click.stop="toggleMobileMenu"
        >
          <span class="whitespace-nowrap">{{ activeTemplate.name }}</span>
          <svg
            class="w-3 h-3 transition-transform duration-200"
            :class="{ 'rotate-180': mobileMenuOpen }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Transition
          enter-active-class="transition duration-150 ease-out origin-top-right"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-100 ease-in origin-top-right"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="mobileMenuOpen"
            class="absolute right-0 mt-1.5 w-48 rounded-xl border border-overlay/10 shadow-xl py-1 z-50"
            style="background: var(--card)"
            role="menu"
            :aria-label="t('builder.resumeTemplate')"
          >
            <button
              v-for="template in TEMPLATES"
              :key="template.id"
              type="button"
              role="menuitemradio"
              :aria-checked="activeId === template.id"
              class="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-[13px] text-left transition-colors hover:bg-overlay/5"
              :class="activeId === template.id ? 'text-ink font-medium' : 'text-muted'"
              @click.stop="selectFromMenu(template.id, template.isPro)"
            >
              <span class="flex items-center gap-2 min-w-0">
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :style="{
                    background: activeId === template.id ? 'var(--accent)' : 'transparent',
                    border: activeId === template.id ? 'none' : '1px solid var(--muted)',
                  }"
                  aria-hidden="true"
                />
                <span class="truncate">{{ template.name }}</span>
              </span>
              <span
                v-if="template.isPro && !userStore.isPremium"
                class="mono-eyebrow text-[9.5px] px-2 py-0.5 rounded text-white shrink-0"
                :style="{ background: 'var(--accent)' }"
              >Pro</span>
            </button>
          </div>
        </Transition>
      </div>
    </template>

  </div>
</template>
