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

  async function loginWithCredentials(email: string, password: string): Promise<void> {
    isAuthenticating.value = true
    authError.value        = null
    try {
      const data = await apiClient.post<{ accessToken: string; user: MeResponse }>(
        '/auth/login',
        { email, password },
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

  // ── Restore session on page load (silent) ─────────────────────────────────

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
