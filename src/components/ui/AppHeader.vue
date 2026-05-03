<script setup lang="ts">
  import { ref } from 'vue'
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import ThemeToggle from '@/components/ui/ThemeToggle.vue'

  const route       = useRoute()
  const router      = useRouter()
  const userStore   = useUserStore()
  const cvStore     = useCVStore()
  const coverLetter = useCoverLetterStore()

  const navLinks = [
    { name: 'builder', label: 'Builder' },
    { name: 'pricing', label: 'Pricing' },
  ]

  const showUserMenu = ref(false)

  /**
   * Logout flow preserved from v1: server-side logout (best-effort) then
   * a synchronous local-state reset, then clear in-memory CV + cover-letter
   * data, then route home. The synchronous reset in cvStore.clearData()
   * fires before any Vue watcher callback so reactive views update to empty
   * immediately — no flash of stale cloud data after logout.
   */
  async function handleLogout(): Promise<void> {
    showUserMenu.value = false
    await userStore.logout()
    await cvStore.clearData()
    await coverLetter.clearData()
    router.push('/')
  }
</script>

<!--
  Editorial header — paper bg, sienna-dot wordmark, mono nav, embedded
  ThemeToggle pill. The 3-column grid (`logo | nav | right cluster`)
  centres nav perfectly without manual flex math.
-->
<template>
  <header
    class="sticky top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4 border-b border-overlay/8"
    style="background: var(--header-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px)"
  >
    <!-- ── Logo ──────────────────────────────────────────────── -->
    <RouterLink
      to="/"
      class="flex items-center gap-2.5 group w-fit"
      aria-label="Resumark home"
    >
      <span
        class="w-2 h-2 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-125"
        :style="{ background: 'var(--accent)' }"
        aria-hidden="true"
      />
      <span class="font-display text-[26px] leading-none tracking-editorial text-ink">
        Resumark
      </span>
    </RouterLink>

    <!-- ── Nav (centered via grid) ────────────────────────────── -->
    <nav class="flex items-center gap-7" aria-label="Main navigation">
      <RouterLink
        v-for="link in navLinks"
        :key="link.name"
        :to="`/${link.name}`"
        :class="[
          'relative font-sans text-[12px] tracking-[0.14em] uppercase font-medium transition-colors',
          route.name === link.name ? 'text-accent' : 'text-muted hover:text-ink',
        ]"
      >
        {{ link.label }}
        <span
          v-if="route.name === link.name"
          class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          :style="{ background: 'var(--accent)' }"
          aria-hidden="true"
        />
      </RouterLink>
    </nav>

    <!-- ── Right side: ThemeToggle + auth actions ─────────────── -->
    <div class="flex items-center justify-end gap-2.5">
      <ThemeToggle />

      <!-- Guest -->
      <template v-if="!userStore.isLoggedIn">
        <RouterLink
          to="/login"
          class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-ink hover:bg-overlay/5 transition-colors"
        >
          Log in
        </RouterLink>
        <RouterLink
          to="/register"
          class="btn-primary text-sm"
        >
          Start free
          <svg
            class="w-3.5 h-3.5 opacity-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </RouterLink>
      </template>

      <!-- Logged in: avatar + dropdown -->
      <template v-else>
        <div class="relative">
          <button
            type="button"
            class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-overlay/10 hover:border-overlay/25 transition-colors"
            style="background: var(--card)"
            @click="showUserMenu = !showUserMenu"
          >
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
              :style="{ background: 'var(--accent)' }"
              aria-hidden="true"
            >
              {{ userStore.user?.name?.charAt(0).toUpperCase() ?? 'U' }}
            </div>
            <span class="text-sm font-medium text-ink max-w-[96px] truncate">
              {{ userStore.user?.name ?? 'Account' }}
            </span>
            <svg
              class="w-3.5 h-3.5 text-muted transition-transform duration-200"
              :class="{ 'rotate-180': showUserMenu }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
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
              v-if="showUserMenu"
              class="absolute right-0 mt-1.5 w-48 rounded-xl border border-overlay/10 shadow-xl py-1 z-50"
              style="background: var(--card)"
            >
              <RouterLink
                to="/dashboard"
                class="flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                @click="showUserMenu = false"
              >
                <span class="w-1 h-1 rounded-full" :style="{ background: 'var(--accent)' }" aria-hidden="true" />
                Dashboard
              </RouterLink>
              <RouterLink
                to="/builder"
                class="flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                @click="showUserMenu = false"
              >
                <span class="w-1 h-1 rounded-full" :style="{ background: 'var(--accent)' }" aria-hidden="true" />
                My résumé
              </RouterLink>
              <RouterLink
                to="/cover-letter"
                class="flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                @click="showUserMenu = false"
              >
                <span class="w-1 h-1 rounded-full" :style="{ background: 'var(--accent)' }" aria-hidden="true" />
                Cover letter
              </RouterLink>
              <div class="h-px bg-overlay/10 my-1" />
              <button
                type="button"
                class="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                @click="handleLogout"
              >
                <span class="w-1 h-1 rounded-full bg-muted" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </Transition>
        </div>
      </template>
    </div>
  </header>
</template>
