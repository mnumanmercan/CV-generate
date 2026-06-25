<script setup lang="ts">
  import { ref } from 'vue'
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import { useLocaleStore } from '@/stores/localeStore'
  import { useI18n } from '@/composables/useI18n'
  import AppDrawer from '@/components/ui/AppDrawer.vue'

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const cvStore = useCVStore()
  const coverLetter = useCoverLetterStore()
  const localeStore = useLocaleStore()
  const { t } = useI18n()

  const showUserMenu = ref(false)
  const showMobileDrawer = ref(false)

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
  Editorial header — paper bg, sienna-dot wordmark, mono nav. The 3-column
  grid (`logo | nav | right cluster`) centres nav perfectly on desktop.
  On mobile the grid collapses to flex-between with a hamburger that opens
  AppDrawer.
-->
<template>
  <header
    class="sticky top-0 z-50 flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] px-4 md:px-6 py-3 md:py-4 border-b border-overlay/8"
    style="
      background: var(--header-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    "
  >
    <!-- ── Logo ──────────────────────────────────────────────── -->
    <RouterLink
      to="/"
      class="flex items-center gap-2.5 group w-fit"
      :aria-label="t('aria.resumeHome')"
    >
      <span
        class="w-2 h-2 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-125"
        :style="{ background: 'var(--accent)' }"
        aria-hidden="true"
      />
      <span
        class="font-display text-[20px] md:text-[26px] leading-none tracking-editorial text-ink"
      >
        Resumark
      </span>
    </RouterLink>

    <!-- ── Nav (centered via grid, desktop only) ──────────────── -->
    <nav class="hidden md:flex items-center gap-5" :aria-label="t('aria.mainNav')">
      <RouterLink
        to="/builder"
        :class="[
          'group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-sans text-[12px] tracking-[0.14em] uppercase font-medium border transition-all duration-200',
          route.name === 'builder'
            ? 'border-accent text-accent'
            : 'border-accent/25 text-ink hover:border-accent hover:-translate-y-px',
        ]"
        :style="
          route.name === 'builder'
            ? { background: 'color-mix(in oklab, var(--accent) 10%, transparent)' }
            : { background: 'color-mix(in oklab, var(--accent) 4%, transparent)' }
        "
      >
        <span
          class="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
          :style="{ background: 'var(--accent)' }"
          aria-hidden="true"
        />
        {{ t('nav.builder') }}
        <svg
          class="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
          :style="{ color: 'var(--accent)' }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </RouterLink>

      <RouterLink
        to="/pricing"
        :class="[
          'font-sans text-[12px] tracking-[0.14em] uppercase font-medium transition-colors',
          route.name === 'pricing' ? 'text-accent' : 'text-muted hover:text-ink',
        ]"
      >
        {{ t('nav.pricing') }}
      </RouterLink>
    </nav>

    <!-- ── Right side: Lang switcher + auth actions (desktop only) ─ -->
    <div class="hidden md:flex items-center justify-end gap-2.5">
      <!-- Language switcher -->
      <div
        class="flex items-center font-mono text-[11px] tracking-[0.14em] uppercase select-none"
        role="group"
        aria-label="Language"
      >
        <button
          type="button"
          class="px-1.5 py-0.5 transition-colors"
          :style="{ color: localeStore.locale === 'en' ? 'var(--accent)' : 'var(--muted)' }"
          :aria-pressed="localeStore.locale === 'en'"
          @click="localeStore.setLocale('en')"
        >
          EN
        </button>
        <span class="opacity-30 text-ink" aria-hidden="true">·</span>
        <button
          type="button"
          class="px-1.5 py-0.5 transition-colors"
          :style="{ color: localeStore.locale === 'tr' ? 'var(--accent)' : 'var(--muted)' }"
          :aria-pressed="localeStore.locale === 'tr'"
          @click="localeStore.setLocale('tr')"
        >
          TR
        </button>
      </div>

      <!-- Session probe still in flight: a neutral placeholder so a returning
           user doesn't see a flash of the guest (login/register) buttons
           before restoreSession() resolves. The access token is in-memory
           only, so auth state is unknown until the refresh round-trip lands. -->
      <template v-if="!userStore.isSessionRestored">
        <div
          class="h-9 w-[124px] rounded-lg animate-pulse"
          style="background: color-mix(in oklab, var(--ink) 8%, transparent)"
          aria-hidden="true"
        />
      </template>

      <!-- Guest -->
      <template v-else-if="!userStore.isLoggedIn">
        <RouterLink
          to="/login"
          class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-ink hover:bg-overlay/5 transition-colors"
        >
          {{ t('nav.login') }}
        </RouterLink>
        <RouterLink to="/register" class="btn-primary text-sm">
          {{ t('nav.register') }}
          <svg
            class="w-3.5 h-3.5 opacity-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
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
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
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
                <span
                  class="w-1 h-1 rounded-full"
                  :style="{ background: 'var(--accent)' }"
                  aria-hidden="true"
                />
                {{ t('nav.dashboard') }}
              </RouterLink>
              <RouterLink
                to="/builder"
                class="flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                @click="showUserMenu = false"
              >
                <span
                  class="w-1 h-1 rounded-full"
                  :style="{ background: 'var(--accent)' }"
                  aria-hidden="true"
                />
                {{ t('nav.myResume') }}
              </RouterLink>
              <RouterLink
                to="/cover-letter"
                class="flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                @click="showUserMenu = false"
              >
                <span
                  class="w-1 h-1 rounded-full"
                  :style="{ background: 'var(--accent)' }"
                  aria-hidden="true"
                />
                {{ t('nav.coverLetter') }}
              </RouterLink>
              <div class="h-px bg-overlay/10 my-1" />
              <button
                type="button"
                class="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
                @click="handleLogout"
              >
                <span class="w-1 h-1 rounded-full bg-muted" aria-hidden="true" />
                {{ t('nav.signOut') }}
              </button>
            </div>
          </Transition>
        </div>
      </template>
    </div>

    <!-- ── Mobile hamburger ─────────────────────────────────── -->
    <button
      type="button"
      class="md:hidden w-11 h-11 rounded-full flex items-center justify-center text-ink hover:bg-overlay/5 transition-colors"
      :aria-label="t('aria.openMenu')"
      :aria-expanded="showMobileDrawer"
      @click="showMobileDrawer = true"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>

    <AppDrawer :visible="showMobileDrawer" @close="showMobileDrawer = false" />
  </header>
</template>
