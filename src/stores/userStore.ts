import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient, setAccessToken, BASE_URL } from '@/services/apiClient'
import { localStorageService, LocalStorageService } from '@/services/storageService'
import { coverLetterStorageService, LocalCoverLetterStorageService } from '@/services/coverLetterStorageService'
import { ApiCVStorageService, ApiCoverLetterStorageService } from '@/services/apiStorageService'

export interface AuthUser {
  id:    string
  name:  string
  email: string
}

interface MeResponse {
  id:        string
  name:      string
  email:     string
  plan:      'FREE' | 'PRO' | 'ENTERPRISE'
  isPremium: boolean
  avatarUrl: string | null
}

export const useUserStore = defineStore('user', () => {
  const isLoggedIn  = ref(false)
  const user        = ref<AuthUser | null>(null)
  const isPremium   = ref(false)

  const isAuthenticating = ref(false)
  const authError        = ref<string | null>(null)

  /**
   * True once `restoreSession()` has resolved (regardless of outcome).
   * Route guards for `requiresAuth` routes should wait on this so the guard
   * does not redirect a logged-in user to /login just because the session
   * probe hasn't finished yet.
   *
   * `main.ts` fires `restoreSession()` after mount (no top-level await), so
   * this starts as `false` and flips to `true` as soon as the refresh probe
   * returns. Public routes (/, /pricing, /login, /register) don't need to
   * wait — they render immediately.
   */
  const isSessionRestored = ref(false)

  const showUpgradeModal    = ref(false)
  const upgradeModalTrigger = ref<string>('')

  const canUploadPhoto      = computed(() => isPremium.value)
  const canUseExtraTemplates = computed(() => isPremium.value)

  // ── Storage delegate wiring ──────────────────────────────────────────────

  function _switchToCloudStorage(): void {
    localStorageService.setDelegate(new ApiCVStorageService())
    coverLetterStorageService.setDelegate(new ApiCoverLetterStorageService())
  }

  function _switchToLocalStorage(): void {
    localStorageService.setDelegate(new LocalStorageService())
    coverLetterStorageService.setDelegate(new LocalCoverLetterStorageService())
  }

  // ── Internal: apply user state after successful auth ──────────────────────

  function _applyUser(me: MeResponse): void {
    user.value      = { id: me.id, name: me.name, email: me.email }
    isLoggedIn.value = true
    isPremium.value  = me.isPremium
    _switchToCloudStorage()
  }

  // ── Register ──────────────────────────────────────────────────────────────

  async function register(name: string, email: string, password: string): Promise<void> {
    isAuthenticating.value = true
    authError.value        = null
    try {
      const data = await apiClient.post<{ accessToken: string; user: MeResponse }>(
        '/auth/register',
        { name, email, password },
      )
      setAccessToken(data.accessToken)
      _applyUser(data.user)
    } catch (err) {
      authError.value = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      throw err
    } finally {
      isAuthenticating.value = false
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async function loginWithCredentials(
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<void> {
    isAuthenticating.value = true
    authError.value        = null
    try {
      // rememberMe is forwarded to the server which extends the refresh
      // cookie + DB token from 7 days to 30. We only send the flag when
      // it's true so the request body stays minimal on the default path.
      const payload: { email: string; password: string; rememberMe?: boolean } = { email, password }
      if (rememberMe) payload.rememberMe = true

      const data = await apiClient.post<{ accessToken: string; user: MeResponse }>(
        '/auth/login',
        payload,
      )
      setAccessToken(data.accessToken)
      _applyUser(data.user)
    } catch (err) {
      authError.value = err instanceof Error ? err.message : 'Invalid email or password.'
      throw err
    } finally {
      isAuthenticating.value = false
    }
  }

  // ── Restore session on page load (silent, non-blocking) ──────────────────

  async function restoreSession(): Promise<void> {
    try {
      // Use raw fetch — NOT apiClient — so that a missing/expired refresh token
      // (normal for guests and first-time visitors) does NOT trigger the
      // resumark:session-expired event, which would redirect everyone to /login.
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method:      'POST',
        credentials: 'include',
      })
      if (!res.ok) return // no valid session — silently remain as guest
      const { accessToken } = await res.json() as { accessToken: string }
      setAccessToken(accessToken)
      const me = await apiClient.get<{ data: MeResponse }>('/user/me')
      _applyUser(me.data)
    } catch {
      // Network error or server down — remain as guest
    } finally {
      // Flip regardless of outcome so router guards unblock.
      isSessionRestored.value = true
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async function logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Best-effort
    } finally {
      setAccessToken(null)
      user.value       = null
      isLoggedIn.value = false
      isPremium.value  = false
      _switchToLocalStorage()
    }
  }

  // ── Upgrade modal ─────────────────────────────────────────────────────────

  function openUpgradeModal(featureName: string): void {
    upgradeModalTrigger.value = featureName
    showUpgradeModal.value    = true
  }

  function closeUpgradeModal(): void {
    showUpgradeModal.value    = false
    upgradeModalTrigger.value = ''
  }

  return {
    isLoggedIn,
    user,
    isPremium,
    isAuthenticating,
    authError,
    isSessionRestored,
    showUpgradeModal,
    upgradeModalTrigger,
    canUploadPhoto,
    canUseExtraTemplates,
    register,
    loginWithCredentials,
    logout,
    restoreSession,
    openUpgradeModal,
    closeUpgradeModal,
  }
})
