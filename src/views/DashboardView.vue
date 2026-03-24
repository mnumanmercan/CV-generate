<!-- Phase 2 stub — route is guarded in router/index.ts (requiresPremium: true) -->
<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import AppHeader from '@/components/ui/AppHeader.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-shell)">
    <AppHeader />
    <main class="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div
        class="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-2xl mb-5"
        aria-hidden="true"
      >
        🚀
      </div>
      <h1 class="text-2xl font-bold text-primary mb-2">Dashboard</h1>
      <p class="text-secondary text-sm max-w-sm">
        The dashboard (multi-CV management, cloud sync) will be available in Phase 2 with a Pro
        subscription.
      </p>
      <RouterLink
        to="/pricing"
        class="mt-6 shimmer-btn px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
      >
        View Plans
      </RouterLink>
    </main>
  </div>
</template>
