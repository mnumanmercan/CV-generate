<script setup lang="ts">
  import { ref } from 'vue'
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const cvStore = useCVStore()
  const coverLetterStore = useCoverLetterStore()

  const navLinks = [
    { name: 'builder',  label: 'Builder'  },
    { name: 'pricing',  label: 'Pricing'  },
  ]

  const showUserMenu = ref(false)

  async function handleLogout(): Promise<void> {
    showUserMenu.value = false
    await userStore.logout()
    // Reload from localStorage (logout() switched the storage delegate back to local).
    // Clear cover letter store so stale cloud data doesn't persist in memory.
    cvStore.loadFromStorage()
    coverLetterStore.clearData()
    router.push('/')
  }
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
      aria-label="Resumark home"
    >
      <!-- Gem-cut logo -->
      <div class="relative w-8 h-8 shrink-0 transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <defs>
            <linearGradient id="logo-hdr" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#06B6D4"/>
              <stop offset="50%" stop-color="#0891B2"/>
              <stop offset="100%" stop-color="#0D9488"/>
            </linearGradient>
            <linearGradient id="logo-sheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(255,255,255,0.20)"/>
              <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
            </linearGradient>
          </defs>
          <!-- Gem body (brilliant-cut pentagon) -->
          <path d="M8 4 H24 L30 14 L16 30 L2 14 Z" fill="url(#logo-hdr)"/>
          <!-- Sheen on crown -->
          <path d="M8 4 H24 L30 14 H2 Z" fill="url(#logo-sheen)"/>
          <!-- Crown facet lines -->
          <path d="M8 4 L16 14" stroke="rgba(255,255,255,0.18)" stroke-width="0.75" fill="none"/>
          <path d="M24 4 L16 14" stroke="rgba(255,255,255,0.18)" stroke-width="0.75" fill="none"/>
          <!-- Girdle line -->
          <line x1="2" y1="14" x2="30" y2="14" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
          <!-- Pavilion center line -->
          <line x1="16" y1="14" x2="16" y2="30" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
          <!-- Sparkle -->
          <circle cx="21" cy="8" r="1.8" fill="white" opacity="0.5"/>
        </svg>
      </div>

      <!-- Wordmark -->
      <span class="text-sm font-semibold tracking-wide leading-none">
        <span class="text-primary">Resu</span>
        <span
          class="text-transparent bg-clip-text"
          style="background-image: linear-gradient(135deg, #0891B2 0%, #0D9488 100%)"
        >mark</span>
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

    <!-- ── Right side: auth actions ──────────────────────────────────── -->
    <div class="flex items-center justify-end gap-2">
      <!-- Guest: Log in + Sign up -->
      <template v-if="!userStore.isLoggedIn">
        <RouterLink
          to="/login"
          class="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary transition-colors duration-200"
        >
          Log in
        </RouterLink>
        <RouterLink
          to="/register"
          class="shimmer-btn flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all"
        >
          Sign up
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
      </template>

      <!-- Logged in: user avatar + dropdown -->
      <template v-else>
        <div class="relative">
          <button
            type="button"
            class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-overlay/10 hover:border-overlay/20 transition-all duration-200"
            style="background: var(--bg-surface)"
            @click="showUserMenu = !showUserMenu"
          >
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style="background: linear-gradient(135deg, #0891B2 0%, #0D9488 100%)"
              aria-hidden="true"
            >
              {{ userStore.user?.name?.charAt(0).toUpperCase() ?? 'U' }}
            </div>
            <span class="text-sm font-medium text-primary max-w-[96px] truncate">
              {{ userStore.user?.name ?? 'Account' }}
            </span>
            <svg
              class="w-3.5 h-3.5 text-secondary transition-transform duration-200"
              :class="{ 'rotate-180': showUserMenu }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown menu -->
          <Transition
            enter-active-class="transition duration-150 ease-out origin-top-right"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-100 ease-in origin-top-right"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-1.5 w-44 rounded-xl border border-overlay/10 shadow-xl py-1 z-50"
              style="background: var(--bg-surface)"
            >
              <RouterLink
                to="/dashboard"
                class="flex items-center gap-2.5 px-3.5 py-2 text-sm text-secondary hover:text-primary hover:bg-overlay/5 transition-colors"
                @click="showUserMenu = false"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </RouterLink>
              <RouterLink
                to="/builder"
                class="flex items-center gap-2.5 px-3.5 py-2 text-sm text-secondary hover:text-primary hover:bg-overlay/5 transition-colors"
                @click="showUserMenu = false"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                My Resume
              </RouterLink>
              <div class="h-px border-t border-overlay/10 my-1" />
              <button
                type="button"
                class="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-secondary hover:text-primary hover:bg-overlay/5 transition-colors"
                @click="handleLogout"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </Transition>
        </div>
      </template>
    </div>
  </header>
</template>
