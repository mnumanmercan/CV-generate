<script setup lang="ts">
  import { RouterLink, useRoute } from 'vue-router'

  const route = useRoute()
</script>

<template>
  <header
    class="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/5"
    style="background: rgba(15, 15, 19, 0.85); backdrop-filter: blur(12px)"
  >
    <!-- Logo -->
    <RouterLink
      to="/"
      class="flex items-center gap-2 group"
      aria-label="CV Generate home"
    >
      <div
        class="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-white text-sm transition-transform group-hover:scale-110"
      >
        CV
      </div>
      <span class="font-semibold text-primary text-sm tracking-wide">CV Generate</span>
    </RouterLink>

    <!-- Nav -->
    <nav class="flex items-center gap-1" aria-label="Main navigation">
      <RouterLink
        to="/builder"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          route.name === 'builder'
            ? 'bg-accent/20 text-accent'
            : 'text-secondary hover:text-primary hover:bg-white/5',
        ]"
      >
        Builder
      </RouterLink>
      <RouterLink
        to="/pricing"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          route.name === 'pricing'
            ? 'bg-accent/20 text-accent'
            : 'text-secondary hover:text-primary hover:bg-white/5',
        ]"
      >
        Pricing
      </RouterLink>
    </nav>

    <!-- CTA -->
    <RouterLink
      to="/builder"
      class="shimmer-btn px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all"
    >
      Get Started
    </RouterLink>
  </header>
</template>
