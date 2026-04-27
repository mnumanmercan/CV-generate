<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { RouterLink, useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'
  import { apiClient } from '@/services/apiClient'

  const router    = useRouter()
  const userStore = useUserStore()

  const email        = ref('')
  const password     = ref('')
  const showPassword = ref(false)
  const rememberMe   = ref(false)
  const isLoading    = ref(false)
  const errorMsg     = ref('')

  // ─── Forgot-password modal ─────────────────────────────────────────────────
  // The endpoint always returns 200 (to prevent account enumeration), so
  // "sent" here means "the request completed", not "the account exists".
  const showForgotModal = ref(false)
  const forgotEmail     = ref('')
  const forgotLoading   = ref(false)
  const forgotSent      = ref(false)
  const forgotError     = ref('')

  function openForgotModal(): void {
    forgotEmail.value     = email.value.trim() // pre-fill from login form
    forgotSent.value      = false
    forgotError.value     = ''
    showForgotModal.value = true
  }

  function closeForgotModal(): void {
    showForgotModal.value = false
  }

  async function submitForgotPassword(): Promise<void> {
    if (!forgotEmail.value.trim()) {
      forgotError.value = 'Please enter your email address.'
      return
    }
    forgotError.value   = ''
    forgotLoading.value = true
    try {
      await apiClient.post('/auth/forgot-password', { email: forgotEmail.value.trim() })
      forgotSent.value = true
    } catch (err) {
      forgotError.value = err instanceof Error ? err.message : 'Could not send reset link. Please try again.'
    } finally {
      forgotLoading.value = false
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!email.value.trim() || !password.value) {
      errorMsg.value = 'Please fill in all fields.'
      return
    }
    errorMsg.value  = ''
    isLoading.value = true

    try {
      await userStore.loginWithCredentials(email.value.trim(), password.value, rememberMe.value)

      // Migrate any existing localStorage data to cloud (last-write-wins)
      const localCVRaw = localStorage.getItem('cv_generate_data')
      const localCLRaw = localStorage.getItem('cover_letter_data')
      if (localCVRaw || localCLRaw) {
        try {
          await apiClient.post('/auth/migrate-local-data', {
            ...(localCVRaw ? { cvData: JSON.parse(localCVRaw) } : {}),
            ...(localCLRaw ? { coverLetterData: JSON.parse(localCLRaw) } : {}),
          })
          if (localCVRaw) localStorage.removeItem('cv_generate_data')
          if (localCLRaw) localStorage.removeItem('cover_letter_data')
        } catch {
          // Non-fatal — cloud data already exists or parse failed
        }
      }

      router.push('/dashboard')
    } catch {
      errorMsg.value = userStore.authError ?? 'Invalid email or password.'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    document.title = 'Sign in — Resumark'
  })
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <!-- ── Editorial header ─────────────────────────────────────── -->
    <header class="flex items-center justify-between px-6 py-5 border-b border-overlay/8">
      <RouterLink
        to="/"
        class="flex items-center gap-2.5 group"
        aria-label="Resumark home"
      >
        <span
          class="w-2 h-2 rounded-full transition-transform duration-200 group-hover:scale-110"
          :style="{ background: 'var(--accent)' }"
          aria-hidden="true"
        />
        <span class="font-display text-[24px] leading-none text-ink">Resumark</span>
      </RouterLink>

      <p class="text-[13.5px] text-muted">
        Don't have an account?
        <RouterLink
          to="/register"
          class="ml-1 font-medium transition-colors hover:opacity-80 underline-offset-4 hover:underline"
          :style="{ color: 'var(--accent)' }"
        >Sign up free</RouterLink>
      </p>
    </header>

    <!-- ── Main ─────────────────────────────────────────────────── -->
    <main class="flex-1 flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-[440px] animate-slide-up">
        <!-- Eyebrow + display heading -->
        <p class="mono-eyebrow mb-3 text-center">A Résumé Builder</p>
        <h1
          class="font-display leading-[1.02] tracking-editorial text-ink mb-3 text-center"
          :style="{ fontSize: 'clamp(44px, 5.4vw, 64px)' }"
        >
          Sign back<br />
          <span class="accent-italic">in</span><span>.</span>
        </h1>
        <p class="text-center text-[14.5px] text-muted mb-10 leading-[1.55]">
          Pick up where you left off — your draft is exactly where you left it.
        </p>

        <!-- Card -->
        <div class="paper-card p-7">
          <!-- Error banner -->
          <div
            v-if="errorMsg"
            class="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-lg text-[13px]"
            style="background: rgba(180,39,39,0.06); border: 1px solid rgba(180,39,39,0.18); color: #B42727"
            role="alert"
          >
            <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {{ errorMsg }}
          </div>

          <!-- Form -->
          <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
            <!-- Email -->
            <div>
              <label class="mono-eyebrow block mb-1.5" for="login-email">
                Email address
              </label>
              <input
                id="login-email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full px-4 py-2.5 text-sm"
              />
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="mono-eyebrow" for="login-password">Password</label>
                <button
                  type="button"
                  class="text-[11px] font-medium tracking-wider uppercase transition-colors hover:opacity-80"
                  :style="{ color: 'var(--accent)' }"
                  @click="openForgotModal"
                >Forgot?</button>
              </div>
              <div class="relative">
                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full px-4 py-2.5 pr-11 text-sm"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <svg v-if="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Remember me -->
            <div class="flex items-center gap-2 pt-1">
              <input
                id="remember-me"
                v-model="rememberMe"
                type="checkbox"
                class="w-4 h-4 rounded cursor-pointer"
                :style="{ accentColor: 'var(--accent)' }"
              />
              <label
                for="remember-me"
                class="text-[13.5px] text-muted cursor-pointer select-none"
              >Remember me for 30 days</label>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="isLoading"
              class="btn-primary w-full justify-center mt-2"
            >
              <svg
                v-if="isLoading"
                class="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ isLoading ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-overlay/8" />
            </div>
            <div class="relative flex justify-center">
              <span
                class="px-3 mono-eyebrow"
                :style="{ background: 'var(--card)' }"
              >or continue with</span>
            </div>
          </div>

          <!-- Google (placeholder) -->
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-[13.5px] font-medium text-ink border border-overlay/10 hover:border-overlay/20 transition-all duration-200"
            style="background: var(--paper)"
          >
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>

        <!-- Footnote -->
        <p class="text-center mt-7 mono-eyebrow text-[10.5px]">
          Free forever · No sign-up required for the builder
        </p>
      </div>
    </main>

    <!-- ─── Forgot password modal ──────────────────────────────────────── -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showForgotModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-title"
        @click.self="closeForgotModal"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
          @click="closeForgotModal"
        />

        <!-- Dialog -->
        <div class="paper-card relative w-full max-w-md p-7 shadow-2xl">
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <p class="mono-eyebrow mb-2">Reset password</p>
              <h2
                id="forgot-title"
                class="font-display leading-tight tracking-editorial text-ink"
                style="font-size: 26px"
              >
                Forgot? <span class="accent-italic">No</span> problem.
              </h2>
            </div>
            <button
              type="button"
              class="text-muted hover:text-ink transition-colors shrink-0"
              aria-label="Close"
              @click="closeForgotModal"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-[13.5px] text-muted mb-5 leading-[1.55]">
            Enter your email and we'll send you a secure link to set a new password.
          </p>

          <!-- Success state -->
          <div
            v-if="forgotSent"
            class="flex items-start gap-3 px-4 py-3 rounded-lg"
            style="background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.22); color: #15803D"
            role="status"
          >
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <p class="text-[13px]">
              If an account exists for <strong>{{ forgotEmail }}</strong>, a reset link is on its way.
              Check your inbox (and spam folder).
            </p>
          </div>

          <!-- Request form -->
          <form v-else novalidate class="space-y-4" @submit.prevent="submitForgotPassword">
            <div
              v-if="forgotError"
              class="flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px]"
              style="background: rgba(180,39,39,0.06); border: 1px solid rgba(180,39,39,0.18); color: #B42727"
              role="alert"
            >
              {{ forgotError }}
            </div>

            <div>
              <label class="mono-eyebrow block mb-1.5" for="forgot-email">Email address</label>
              <input
                id="forgot-email"
                v-model="forgotEmail"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full px-4 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              :disabled="forgotLoading"
              class="btn-primary w-full justify-center"
            >
              <svg
                v-if="forgotLoading"
                class="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ forgotLoading ? 'Sending…' : 'Send reset link' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>
