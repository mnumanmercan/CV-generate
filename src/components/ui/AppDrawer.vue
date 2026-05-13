<script setup lang="ts">
  import { onMounted, onUnmounted, watch } from 'vue'
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'
  import { useCVStore } from '@/stores/cvStore'
  import { useCoverLetterStore } from '@/stores/coverLetterStore'
  import { useLocaleStore } from '@/stores/localeStore'
  import { useI18n } from '@/composables/useI18n'

  const props = defineProps<{ visible: boolean }>()
  const emit = defineEmits<{ close: [] }>()

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const cvStore = useCVStore()
  const coverLetter = useCoverLetterStore()
  const localeStore = useLocaleStore()
  const { t } = useI18n()

  watch(
    () => route.fullPath,
    () => emit('close'),
  )

  // Lock background scroll while drawer is open and bind ESC.
  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && props.visible) emit('close')
  }
  watch(
    () => props.visible,
    (v) => {
      if (typeof document === 'undefined') return
      document.body.style.overflow = v ? 'hidden' : ''
    },
  )
  onMounted(() => window.addEventListener('keydown', onKey))
  onUnmounted(() => {
    window.removeEventListener('keydown', onKey)
    if (typeof document !== 'undefined') document.body.style.overflow = ''
  })

  async function handleLogout(): Promise<void> {
    emit('close')
    await userStore.logout()
    await cvStore.clearData()
    await coverLetter.clearData()
    router.push('/')
  }
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[70]"
        style="
          background: color-mix(in oklab, var(--ink) 38%, transparent);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        "
        aria-hidden="true"
        @click="emit('close')"
      />
    </Transition>

    <!-- Drawer panel -->
    <Transition
      enter-active-class="transition-transform duration-280"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="visible"
        class="fixed top-0 right-0 bottom-0 z-[80] w-[320px] max-w-[85vw] flex flex-col shadow-2xl"
        style="background: var(--paper); border-left: 1px solid var(--rule)"
        role="dialog"
        aria-modal="true"
        :aria-label="t('aria.mainNav')"
      >
        <!-- Drawer header: logo + close -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-overlay/8">
          <div class="flex items-center gap-2">
            <span
              class="w-2 h-2 rounded-full"
              :style="{ background: 'var(--accent)' }"
              aria-hidden="true"
            />
            <span class="font-display text-[22px] leading-none tracking-editorial text-ink"
              >Resumark</span
            >
          </div>
          <button
            type="button"
            class="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-overlay/5 transition-colors"
            :aria-label="t('aria.closeMenu')"
            @click="emit('close')"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Nav links -->
        <nav
          class="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-1"
          :aria-label="t('aria.mainNav')"
        >
          <RouterLink
            to="/builder"
            :class="[
              'group inline-flex items-center gap-3 px-3.5 py-3 rounded-xl font-sans text-[13px] tracking-[0.14em] uppercase font-medium border transition-all duration-200',
              route.name === 'builder'
                ? 'border-accent text-accent'
                : 'border-accent/25 text-ink hover:border-accent',
            ]"
            :style="
              route.name === 'builder'
                ? { background: 'color-mix(in oklab, var(--accent) 10%, transparent)' }
                : { background: 'color-mix(in oklab, var(--accent) 4%, transparent)' }
            "
          >
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :style="{ background: 'var(--accent)' }"
              aria-hidden="true"
            />
            {{ t('nav.builder') }}
          </RouterLink>

          <RouterLink
            to="/pricing"
            :class="[
              'inline-flex items-center px-3.5 py-3 rounded-xl font-sans text-[13px] tracking-[0.14em] uppercase font-medium transition-colors',
              route.name === 'pricing' ? 'text-accent' : 'text-muted hover:text-ink',
            ]"
          >
            {{ t('nav.pricing') }}
          </RouterLink>

          <!-- Logged-in user-specific links -->
          <template v-if="userStore.isLoggedIn">
            <RouterLink
              to="/dashboard"
              :class="[
                'inline-flex items-center px-3.5 py-3 rounded-xl text-sm transition-colors',
                route.name === 'dashboard' ? 'text-accent' : 'text-muted hover:text-ink',
              ]"
            >
              {{ t('nav.dashboard') }}
            </RouterLink>
            <RouterLink
              to="/cover-letter"
              :class="[
                'inline-flex items-center px-3.5 py-3 rounded-xl text-sm transition-colors',
                route.name === 'cover-letter' ? 'text-accent' : 'text-muted hover:text-ink',
              ]"
            >
              {{ t('nav.coverLetter') }}
            </RouterLink>
          </template>
        </nav>

        <!-- Footer: language switcher + auth -->
        <div class="border-t border-overlay/8 px-4 py-4 flex flex-col gap-3">
          <div
            class="flex items-center justify-center font-mono text-[12px] tracking-[0.14em] uppercase select-none"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              class="px-3 py-1.5 transition-colors"
              :style="{ color: localeStore.locale === 'en' ? 'var(--accent)' : 'var(--muted)' }"
              :aria-pressed="localeStore.locale === 'en'"
              @click="localeStore.setLocale('en')"
            >
              EN
            </button>
            <span class="opacity-30 text-ink" aria-hidden="true">·</span>
            <button
              type="button"
              class="px-3 py-1.5 transition-colors"
              :style="{ color: localeStore.locale === 'tr' ? 'var(--accent)' : 'var(--muted)' }"
              :aria-pressed="localeStore.locale === 'tr'"
              @click="localeStore.setLocale('tr')"
            >
              TR
            </button>
          </div>

          <div class="flex flex-col gap-2">
            <template v-if="!userStore.isLoggedIn">
              <RouterLink
                to="/login"
                class="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-lg text-sm text-ink hover:bg-overlay/5 transition-colors border border-overlay/12"
              >
                {{ t('nav.login') }}
              </RouterLink>
              <RouterLink to="/register" class="btn-primary text-sm w-full justify-center">
                {{ t('nav.register') }}
              </RouterLink>
            </template>
            <template v-else>
              <button
                type="button"
                class="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-lg text-sm text-muted hover:text-ink hover:bg-overlay/5 transition-colors border border-overlay/12"
                @click="handleLogout"
              >
                {{ t('nav.signOut') }}
              </button>
            </template>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
