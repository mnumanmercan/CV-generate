<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter, RouterLink } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'

  const route             = useRoute()
  const router            = useRouter()
  const userStore         = useUserStore()
  const cvStore           = useCVStore()
  const coverLetterStore  = useCoverLetterStore()

  // Both stores expose a short-lived saveIndicatorVisible flag that flicks on
  // for ~1s after every persisted edit. We OR them together: only one view is
  // mounted at a time, so they never both fire — and this keeps the sub-nav
  // store-agnostic.
  const { saveIndicatorVisible: cvSaved } = storeToRefs(cvStore)
  const { saveIndicatorVisible: clSaved } = storeToRefs(coverLetterStore)
  const showSaved = computed(() => cvSaved.value || clSaved.value)

  function openCoverLetter(): void {
    if (userStore.isPremium) {
      router.push('/cover-letter')
    } else {
      userStore.openUpgradeModal('Cover Letter Generator')
    }
  }
</script>

<!--
  Sub-nav strip beneath AppHeader on the builder + cover-letter views. Two
  pill tabs (◉ CV Builder · ✎ Cover Letter Pro) plus a quiet save-status
  indicator on the right that fades in for a beat after every persisted edit.
  No icons-from-a-set — just two decorative glyphs in the editorial language
  of the rest of the app.
-->
<template>
  <div
    class="flex items-center justify-between px-6 py-3 border-b border-overlay/8 shrink-0"
    style="background: var(--paper)"
    role="tablist"
    aria-label="Builder tools"
  >
    <!-- Tabs -->
    <div class="flex items-center gap-1">
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
          class="mono-eyebrow text-[9.5px] px-1.5 py-px rounded text-white"
          :style="{ background: 'var(--accent)' }"
          aria-label="Pro feature"
        >Pro</span>
      </button>
    </div>

    <!-- Save indicator — fades in for a beat after every persisted edit -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showSaved"
        class="flex items-center gap-2"
        aria-live="polite"
        role="status"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          style="background: #22C55E"
          aria-hidden="true"
        />
        <span class="mono-eyebrow text-[10.5px]">
          Saved to this browser · just now
        </span>
      </div>
    </Transition>
  </div>
</template>
