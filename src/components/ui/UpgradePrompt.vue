<script setup lang="ts">
  import { ref } from 'vue'
  import { RouterLink } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'

  const userStore = useUserStore()

  const email = ref('')
  const submitted = ref(false)
  const emailError = ref('')

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  function handleNotify(): void {
    if (!email.value.trim()) {
      emailError.value = 'Please enter your email address.'
      return
    }
    if (!validateEmail(email.value)) {
      emailError.value = 'Please enter a valid email address.'
      return
    }
    emailError.value = ''
    // Phase 2: POST email to waitlist API
    console.info('[Waitlist] Email registered:', email.value)
    submitted.value = true
  }

  function handleClose(): void {
    userStore.closeUpgradeModal()
    // Reset state for next open
    setTimeout(() => {
      email.value = ''
      submitted.value = false
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
      @keydown.esc="handleClose"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="handleClose"
      />

      <!-- Modal card -->
      <div
        class="relative z-10 w-full max-w-sm rounded-2xl p-7 shadow-2xl border border-white/10"
        style="background: var(--bg-surface)"
      >
        <!-- ── Success state ── -->
        <template v-if="submitted">
          <div class="flex flex-col items-center text-center gap-4">
            <div class="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <svg class="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-primary mb-1">You're on the list!</h2>
              <p class="text-sm text-secondary">We'll let you know the moment Pro launches. Thanks for your interest.</p>
            </div>
            <button
              type="button"
              class="w-full py-2.5 rounded-xl border border-white/10 text-sm font-medium text-secondary hover:text-primary hover:border-white/20 transition-colors"
              @click="handleClose"
            >
              Close
            </button>
          </div>
        </template>

        <!-- ── Default state ── -->
        <template v-else>
          <!-- Icon -->
          <div
            class="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mb-5 mx-auto"
            aria-hidden="true"
          >
            <svg class="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>

          <h2
            id="upgrade-modal-title"
            class="text-lg font-semibold text-center text-primary mb-1"
          >
            Pro Feature
          </h2>
          <p class="text-secondary text-center text-sm mb-6 leading-relaxed">
            <strong class="text-primary">{{ userStore.upgradeModalTrigger }}</strong> is coming to the
            Pro plan. Be the first to know when it launches.
          </p>

          <!-- Email waitlist -->
          <div class="flex flex-col gap-2 mb-4">
            <input
              v-model="email"
              type="email"
              placeholder="your@email.com"
              autocomplete="email"
              class="w-full px-3.5 py-2.5 text-sm rounded-xl"
              :class="emailError ? 'border-red-500/50' : ''"
              aria-label="Email address for Pro waitlist"
              @keydown.enter="handleNotify"
            />
            <p v-if="emailError" class="text-xs text-red-400 flex items-center gap-1" role="alert">
              <span aria-hidden="true">⚠</span> {{ emailError }}
            </p>
            <button
              type="button"
              class="shimmer-btn w-full py-2.5 rounded-xl text-white text-sm font-semibold"
              @click="handleNotify"
            >
              Notify Me When Pro Launches
            </button>
          </div>

          <!-- Footer actions -->
          <div class="flex items-center justify-between pt-3 border-t border-white/5">
            <button
              type="button"
              class="text-xs text-secondary hover:text-primary transition-colors"
              @click="handleClose"
            >
              Maybe later
            </button>
            <RouterLink
              to="/pricing"
              class="text-xs text-accent hover:text-accent/80 transition-colors"
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
