<script setup lang="ts">
  import { ref } from 'vue'
  import { RouterLink, useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'

  const router = useRouter()
  const userStore = useUserStore()

  const email = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const rememberMe = ref(false)
  const isLoading = ref(false)
  const errorMsg = ref('')

  async function handleSubmit(): Promise<void> {
    if (!email.value.trim() || !password.value) {
      errorMsg.value = 'Please fill in all fields.'
      return
    }
    errorMsg.value = ''
    isLoading.value = true

    // Phase 2: replace with real auth call
    await new Promise(resolve => setTimeout(resolve, 900))
    userStore.login({ name: 'User', email: email.value.trim() })
    isLoading.value = false
    router.push('/')
  }
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--bg-shell)">
    <!-- Aurora + dot-grid background -->
    <div class="aurora-ambient" aria-hidden="true" />
    <div
      class="dot-grid fixed inset-0 pointer-events-none"
      style="opacity: 0.5"
      aria-hidden="true"
    />

    <!-- Minimal header -->
    <header
      class="relative z-10 flex items-center justify-between px-6 py-3.5 border-b border-overlay/5"
      style="background: var(--header-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px)"
    >
      <RouterLink
        to="/"
        class="flex items-center gap-2.5 group"
        aria-label="Resumark home"
      >
        <div class="relative w-8 h-8 shrink-0 transition-transform duration-300 group-hover:scale-105">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <defs>
              <linearGradient id="logo-ln" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#06B6D4" />
                <stop offset="50%" stop-color="#0891B2" />
                <stop offset="100%" stop-color="#0D9488" />
              </linearGradient>
              <linearGradient id="logo-sheen-ln" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(255,255,255,0.20)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <path d="M8 4 H24 L30 14 L16 30 L2 14 Z" fill="url(#logo-ln)" />
            <path d="M8 4 H24 L30 14 H2 Z" fill="url(#logo-sheen-ln)" />
            <path d="M8 4 L16 14" stroke="rgba(255,255,255,0.18)" stroke-width="0.75" fill="none" />
            <path d="M24 4 L16 14" stroke="rgba(255,255,255,0.18)" stroke-width="0.75" fill="none" />
            <line x1="2" y1="14" x2="30" y2="14" stroke="rgba(255,255,255,0.12)" stroke-width="0.5" />
            <line x1="16" y1="14" x2="16" y2="30" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
            <circle cx="21" cy="8" r="1.8" fill="white" opacity="0.5" />
          </svg>
        </div>
        <span class="text-sm font-semibold tracking-wide leading-none">
          <span class="text-primary">Resu</span>
          <span
            class="text-transparent bg-clip-text"
            style="background-image: linear-gradient(135deg, #0891B2 0%, #0D9488 100%)"
          >mark</span>
        </span>
      </RouterLink>

      <p class="text-sm text-secondary">
        Don't have an account?
        <RouterLink
          to="/register"
          class="font-semibold transition-colors hover:opacity-80"
          style="color: var(--accent)"
        >Sign up free</RouterLink>
      </p>
    </header>

    <!-- Main -->
    <main class="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md animate-slide-up">
        <!-- Card -->
        <div
          class="rounded-2xl border border-overlay/10 shadow-2xl overflow-hidden"
          style="background: var(--bg-surface)"
        >
          <!-- Card accent bar -->
          <div
            class="h-1 w-full"
            style="background: linear-gradient(90deg, #0891B2 0%, #06B6D4 50%, #0D9488 100%)"
          />

          <div class="p-8">
            <!-- Heading -->
            <div class="text-center mb-8">
              <h1 class="text-2xl font-bold text-primary mb-1.5">Welcome back</h1>
              <p class="text-sm text-secondary">Sign in to continue building your resume</p>
            </div>

            <!-- Error banner -->
            <div
              v-if="errorMsg"
              class="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm"
              style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22); color: #ef4444"
              role="alert"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {{ errorMsg }}
            </div>

            <!-- Form -->
            <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-primary mb-1.5" for="login-email">
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
                  <label class="text-sm font-medium text-primary" for="login-password">
                    Password
                  </label>
                  <a
                    href="#"
                    class="text-xs font-medium transition-colors hover:opacity-80"
                    style="color: var(--accent)"
                    @click.prevent
                  >Forgot password?</a>
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
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    @click="showPassword = !showPassword"
                  >
                    <svg v-if="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Remember me -->
              <div class="flex items-center gap-2 pt-0.5">
                <input
                  id="remember-me"
                  v-model="rememberMe"
                  type="checkbox"
                  class="w-4 h-4 rounded cursor-pointer"
                  style="accent-color: var(--accent)"
                />
                <label
                  for="remember-me"
                  class="text-sm text-secondary cursor-pointer select-none"
                >Remember me for 30 days</label>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                :disabled="isLoading"
                class="shimmer-btn w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold mt-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                <div class="w-full border-t border-overlay/10" />
              </div>
              <div class="relative flex justify-center text-xs">
                <span
                  class="px-3 text-secondary"
                  style="background: var(--bg-surface)"
                >or continue with</span>
              </div>
            </div>

            <!-- Google (placeholder) -->
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium text-primary border border-overlay/10 hover:border-overlay/20 transition-all duration-200"
              style="background: var(--bg-shell)"
            >
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
        </div>

        <!-- Bottom link -->
        <p class="text-center mt-6 text-sm text-secondary">
          Don't have an account?
          <RouterLink
            to="/register"
            class="font-semibold transition-colors hover:opacity-80"
            style="color: var(--accent)"
          >Create one free</RouterLink>
        </p>
      </div>
    </main>
  </div>
</template>
