<script setup lang="ts">
  import { useRoute, useRouter, RouterLink } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()

  function handleCoverLetterClick(): void {
    if (userStore.isPremium) {
      router.push('/cover-letter')
    } else {
      userStore.openUpgradeModal('Cover Letter Generator')
    }
  }
</script>

<template>
  <div
    class="flex items-center gap-0.5 px-4 py-2 border-b border-overlay/5 shrink-0"
    style="background: var(--header-bg); backdrop-filter: blur(8px)"
    role="tablist"
    aria-label="Builder tools"
  >
    <RouterLink
      to="/builder"
      role="tab"
      :aria-selected="route.name === 'builder'"
      class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
      :class="route.name === 'builder'
        ? 'text-primary bg-overlay/8'
        : 'text-secondary hover:text-primary hover:bg-overlay/5'"
    >
      <!-- Document icon -->
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      CV Builder
    </RouterLink>

    <button
      type="button"
      role="tab"
      :aria-selected="route.name === 'cover-letter'"
      class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
      :class="route.name === 'cover-letter'
        ? 'text-primary bg-overlay/8'
        : userStore.isPremium
          ? 'text-secondary hover:text-primary hover:bg-overlay/5'
          : 'text-secondary/50 hover:text-secondary/70 hover:bg-overlay/5'"
      @click="handleCoverLetterClick"
    >
      <!-- Sparkle icon -->
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
      Cover Letter
      <span
        v-if="!userStore.isPremium"
        class="text-[9px] font-bold px-1.5 py-px rounded-full text-white leading-none"
        style="background: linear-gradient(135deg, #0891B2, #0D9488)"
        aria-label="Pro feature"
      >Pro</span>
    </button>
  </div>
</template>
