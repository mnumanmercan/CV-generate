<script setup lang="ts">
  import { useUserStore } from '@/stores/userStore'
  import { RouterLink } from 'vue-router'

  const userStore = useUserStore()
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="userStore.showUpgradeModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'upgrade-modal-title'"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="userStore.closeUpgradeModal"
      />

      <!-- Modal card -->
      <div
        class="relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl border border-white/10"
        style="background: var(--bg-surface)"
      >
        <!-- Icon -->
        <div
          class="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-5 mx-auto"
          aria-hidden="true"
        >
          <svg class="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 3l14 9-14 9V3z"
            />
          </svg>
        </div>

        <h2
          id="upgrade-modal-title"
          class="text-xl font-semibold text-center text-primary mb-2"
        >
          Pro Feature
        </h2>
        <p class="text-secondary text-center text-sm mb-6">
          <strong class="text-primary">{{ userStore.upgradeModalTrigger }}</strong> is available on
          the Pro plan. Upgrade to unlock photo uploads, premium templates, and more.
        </p>

        <div class="flex gap-3">
          <button
            class="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-secondary text-sm font-medium hover:text-primary hover:border-white/20 transition-colors"
            @click="userStore.closeUpgradeModal"
          >
            Maybe Later
          </button>
          <RouterLink
            to="/pricing"
            class="flex-1 shimmer-btn px-4 py-2.5 rounded-lg text-white text-sm font-semibold text-center transition-all"
            @click="userStore.closeUpgradeModal"
          >
            View Plans
          </RouterLink>
        </div>
      </div>
    </div>
  </Transition>
</template>
