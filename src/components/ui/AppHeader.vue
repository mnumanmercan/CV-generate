<script setup lang="ts">
  import { RouterLink, useRoute } from 'vue-router'

  const route = useRoute()

  const navLinks = [
    { name: 'builder',  label: 'Builder'  },
    { name: 'pricing',  label: 'Pricing'  },
  ]
</script>

<template>
  <header
    class="sticky top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-6 py-3.5 border-b border-overlay/5"
    style="background: var(--header-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px)"
  >
    <!-- ── Logo ──────────────────────────────────────────────── -->
    <RouterLink
      to="/"
      class="flex items-center gap-2.5 group w-fit"
      aria-label="CV Generate home"
    >
      <!-- CV document icon -->
      <div class="relative w-8 h-8 shrink-0 transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <defs>
            <linearGradient id="logo-hdr" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0891B2"/>
              <stop offset="100%" stop-color="#0D9488"/>
            </linearGradient>
            <linearGradient id="logo-sheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(255,255,255,0.20)"/>
              <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
            </linearGradient>
          </defs>
          <!-- Paper body -->
          <rect x="3" y="1" width="22" height="29" rx="3" fill="#0C1523"/>
          <rect x="3" y="1" width="22" height="29" rx="3" stroke="rgba(8,145,178,0.35)" stroke-width="0.75"/>
          <!-- Header gradient -->
          <path d="M3 4A3 3 0 016 1h16a3 3 0 013 3v8H3V4z" fill="url(#logo-hdr)"/>
          <path d="M3 4A3 3 0 016 1h16a3 3 0 013 3v8H3V4z" fill="url(#logo-sheen)"/>
          <!-- Avatar circle -->
          <circle cx="9.5" cy="6" r="2.4" fill="rgba(255,255,255,0.92)"/>
          <!-- Name line -->
          <rect x="14" y="4" width="8.5" height="2" rx="1" fill="rgba(255,255,255,0.95)"/>
          <!-- Title line -->
          <rect x="14" y="7.5" width="6" height="1.4" rx="0.7" fill="rgba(255,255,255,0.58)"/>
          <!-- Content lines -->
          <rect x="6" y="16" width="15" height="1.8" rx="0.9" fill="#94A3B8" opacity="0.42"/>
          <rect x="6" y="20" width="11" height="1.8" rx="0.9" fill="#94A3B8" opacity="0.32"/>
          <rect x="6" y="24" width="13" height="1.8" rx="0.9" fill="#94A3B8" opacity="0.32"/>
        </svg>
      </div>

      <!-- Wordmark -->
      <span class="text-sm font-semibold tracking-wide leading-none">
        <span class="text-primary">CV</span>
        <span
          class="text-transparent bg-clip-text ml-1"
          style="background-image: linear-gradient(135deg, #0891B2 0%, #0D9488 100%)"
        >Generate</span>
      </span>
    </RouterLink>

    <!-- ── Nav (centered via grid) ────────────────────────────── -->
    <nav
      class="flex items-center gap-0.5 px-1.5 py-1.5 rounded-xl border border-overlay/8 bg-overlay/[0.025]"
      aria-label="Main navigation"
    >
      <RouterLink
        v-for="link in navLinks"
        :key="link.name"
        :to="`/${link.name}`"
        :class="[
          'relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
          route.name === link.name
            ? 'text-primary'
            : 'text-secondary hover:text-primary',
        ]"
      >
        <!-- Active pill background -->
        <span
          v-if="route.name === link.name"
          class="absolute inset-0 rounded-lg"
          style="background: linear-gradient(135deg, rgba(8,145,178,0.22) 0%, rgba(13,148,136,0.14) 100%); border: 1px solid rgba(8,145,178,0.22)"
          aria-hidden="true"
        />
        <!-- Active indicator dot -->
        <span
          v-if="route.name === link.name"
          class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
          aria-hidden="true"
        />
        <span class="relative">{{ link.label }}</span>
      </RouterLink>
    </nav>

    <!-- ── Right side: CTA ────────────────────────────────────── -->
    <div class="flex items-center justify-end gap-2">
      <RouterLink
        to="/builder"
        class="shimmer-btn flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all"
      >
        Get Started
        <svg
          class="w-3.5 h-3.5 opacity-80"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </RouterLink>
    </div>
  </header>
</template>
