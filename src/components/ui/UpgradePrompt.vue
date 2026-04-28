<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'
  import { apiClient } from '@/services/apiClient'

  const userStore = useUserStore()

  // @keydown.esc on a non-focusable div never fires.
  // Register on window instead so ESC always closes the modal.
  function onWindowKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && userStore.showUpgradeModal) handleClose()
  }
  onMounted(() => window.addEventListener('keydown', onWindowKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onWindowKeydown))

  const email        = ref('')
  const submitted    = ref(false)
  const isSubmitting = ref(false)
  const emailError   = ref('')

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  async function handleNotify(): Promise<void> {
    if (!email.value.trim()) {
      emailError.value = 'Please enter your email address.'
      return
    }
    if (!validateEmail(email.value)) {
      emailError.value = 'Please enter a valid email address.'
      return
    }
    emailError.value   = ''
    isSubmitting.value = true
    try {
      await apiClient.post('/waitlist', {
        email:  email.value.trim(),
        source: 'upgrade_modal',
      })
      submitted.value = true
    } catch {
      emailError.value = 'Something went wrong. Please try again.'
    } finally {
      isSubmitting.value = false
    }
  }

  function handleClose(): void {
    userStore.closeUpgradeModal()
    // Reset state for next open
    setTimeout(() => {
      email.value      = ''
      submitted.value  = false
      emailError.value = ''
    }, 300)
  }
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
      aria-labelledby="upgrade-modal-title"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        @click="handleClose"
      />

      <!-- Modal card -->
      <div class="paper-card relative z-10 w-full max-w-md p-7 shadow-2xl">

        <!-- ── Success state ── -->
        <template v-if="submitted">
          <div class="flex flex-col items-center text-center gap-5">
            <span
              class="font-display leading-none"
              :style="{ fontSize: '52px', color: 'var(--accent)' }"
              aria-hidden="true"
            >✓</span>
            <div>
              <p class="mono-eyebrow mb-2">You're on the list</p>
              <h2 class="font-display leading-tight tracking-editorial text-ink mb-2"
                  style="font-size: 28px">
                See you <span class="accent-italic">soon</span>.
              </h2>
              <p class="text-[13.5px] text-muted leading-[1.55]">
                We'll let you know the moment Pro launches. Thanks for your interest.
              </p>
            </div>
            <button
              type="button"
              class="btn-ghost w-full justify-center"
              @click="handleClose"
            >
              Close
            </button>
          </div>
        </template>

        <!-- ── Default state ── -->
        <template v-else>
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <p class="mono-eyebrow mb-2">Pro feature</p>
              <h2
                id="upgrade-modal-title"
                class="font-display leading-tight tracking-editorial text-ink"
                style="font-size: 26px"
              >
                Coming to <span class="accent-italic">Pro</span>.
              </h2>
            </div>
            <button
              type="button"
              class="text-muted hover:text-ink transition-colors shrink-0"
              aria-label="Close"
              @click="handleClose"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-[13.5px] text-muted mb-6 leading-[1.55]">
            <span class="text-ink font-medium">{{ userStore.upgradeModalTrigger }}</span> is coming to the Pro plan.
            Drop your email — we'll let you know the moment it launches.
          </p>

          <!-- Error banner -->
          <div
            v-if="emailError"
            class="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-lg text-[13px]"
            style="background: rgba(180,39,39,0.06); border: 1px solid rgba(180,39,39,0.18); color: #B42727"
            role="alert"
          >
            <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {{ emailError }}
          </div>

          <!-- Email waitlist -->
          <div class="flex flex-col gap-3 mb-5">
            <div>
              <label class="mono-eyebrow block mb-1.5" for="upgrade-email">Email address</label>
              <input
                id="upgrade-email"
                v-model="email"
                type="email"
                placeholder="you@example.com"
                autocomplete="email"
                class="w-full px-4 py-2.5 text-sm"
                aria-label="Email address for Pro waitlist"
                @keydown.enter="handleNotify"
              />
            </div>
            <button
              type="button"
              :disabled="isSubmitting"
              class="btn-primary w-full justify-center"
              @click="handleNotify"
            >
              <svg
                v-if="isSubmitting"
                class="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ isSubmitting ? 'Registering…' : 'Notify me when Pro launches' }}
            </button>
          </div>

          <!-- Footer actions -->
          <div class="flex items-center justify-between pt-4 border-t border-overlay/8">
            <button
              type="button"
              class="mono-eyebrow text-[10.5px] text-muted hover:text-ink transition-colors"
              @click="handleClose"
            >
              Maybe later
            </button>
            <RouterLink
              to="/pricing"
              class="mono-eyebrow text-[10.5px] transition-colors hover:opacity-80"
              :style="{ color: 'var(--accent)' }"
              @click="handleClose"
            >
              View plans →
            </RouterLink>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>
