import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient, setAccessToken, refreshAccessToken } from '@/services/apiClient'
import { useCVStore } from '@/stores/cvStore'
import { localStorageService, LocalStorageService } from '@/services/storageService'
import {
  coverLetterStorageService,
  LocalCoverLetterStorageService,
} from '@/services/coverLetterStorageService'
import { ApiCVStorageService, ApiCoverLetterStorageService } from '@/services/apiStorageService'

export interface AuthUser {
  id: string
  name: string
  email: string
}

interface MeResponse {
  id: string
  name: string
  email: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  isPremium: boolean
  avatarUrl: string | null
}

export const useUserStore = defineStore('user', () => {
  const isLoggedIn = ref(false)
  const user = ref<AuthUser | null>(null)
  const isPremium = ref(false)

  const isAuthenticating = ref(false)
  const authError = ref<string | null>(null)

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

  // Captured promise for the boot-time session probe so other code (e.g.
  // cvStore.loadFromStorage) can AWAIT it instead of racing it. Memoized so
  // repeat callers and the router guard share the single in-flight run.
  let sessionRestorePromise: Promise<void> | null = null

  const showUpgradeModal = ref(false)
  const upgradeModalTrigger = ref<string>('')

  const canUploadPhoto = computed(() => isPremium.value)
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

  /**
   * Re-hydrate the CV store from whichever backend is now active.
   *
   * Called immediately after every storage-delegate swap (login, register,
   * session-restore, logout). Without this, the store keeps the data it loaded
   * from the PREVIOUS backend and the sticky `isLoaded` guard stops any
   * subsequently-mounted view from re-reading — so the form shows empty/stale
   * data until a hard refresh. We clear `isLoaded` (so future view mounts also
   * re-read) and reload now (so an already-mounted view updates in place).
   *
   * Lazy `useCVStore()` keeps the user↔cv store dependency cycle resolvable.
   */
  function _reloadActiveCV(): void {
    const cvStore = useCVStore()
    cvStore.isLoaded = false
    void cvStore.loadFromStorage()
  }

  // ── Internal: apply user state after successful auth ──────────────────────

  function _applyUser(me: MeResponse): void {
    user.value = { id: me.id, name: me.name, email: me.email }
    isLoggedIn.value = true
    isPremium.value = me.isPremium
    _switchToCloudStorage()
  }

  // ── Register ──────────────────────────────────────────────────────────────

  async function register(name: string, email: string, password: string): Promise<void> {
    isAuthenticating.value = true
    authError.value = null
    try {
      const data = await apiClient.post<{ accessToken: string; user: MeResponse }>(
        '/auth/register',
        { name, email, password },
      )
      setAccessToken(data.accessToken)
      _applyUser(data.user)
      // Swap to cloud storage just happened — pull this user's CV so the
      // post-register redirect (→ /dashboard) shows real data, not the guest
      // defaults still sitting in the store.
      _reloadActiveCV()
    } catch (err) {
      authError.value =
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
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
    authError.value = null
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
      // Storage delegate is now cloud — reload so the data the user just
      // signed in to see is in the store before /dashboard mounts.
      _reloadActiveCV()
    } catch (err) {
      authError.value = err instanceof Error ? err.message : 'Invalid email or password.'
      throw err
    } finally {
      isAuthenticating.value = false
    }
  }

  // ── Restore session on page load (silent, non-blocking) ──────────────────

  function restoreSession(): Promise<void> {
    // Memoize so the boot call (main.ts) and any awaiter (cvStore via
    // ensureSessionRestored, the router guard) share ONE probe.
    if (sessionRestorePromise) return sessionRestorePromise
    sessionRestorePromise = (async () => {
      try {
        // Share apiClient's single-flight refresh so this boot-time probe and any
        // 401-triggered refresh collapse into ONE /auth/refresh — otherwise the
        // two race, and because the endpoint rotates tokens, the loser is logged
        // out. refreshAccessToken() returns false (not throws) for a missing or
        // expired token — normal for guests — and never dispatches
        // resumark:session-expired, so guests aren't redirected to /login.
        const ok = await refreshAccessToken()
        if (!ok) return // no valid session — silently remain as guest
        const me = await apiClient.get<{ data: MeResponse }>('/user/me')
        _applyUser(me.data)
      } catch {
        // Network error or server down — remain as guest
      } finally {
        // Flip regardless of outcome so router guards unblock.
        isSessionRestored.value = true
      }
      // Reload the active CV from the now-correct backend. Deliberately AFTER
      // the finally above flipped isSessionRestored — so the loadFromStorage
      // this kicks off finds ensureSessionRestored() already resolved and can't
      // deadlock awaiting this very probe.
      if (isLoggedIn.value) _reloadActiveCV()
    })()
    return sessionRestorePromise
  }

  /**
   * Resolve once the boot-time session probe has settled (success or not).
   * cvStore.loadFromStorage awaits this so a cold load on a PUBLIC route
   * (/, /builder — whose router guards don't wait) reads from the correct
   * cloud-vs-local backend instead of the local default the probe may not
   * have swapped away from yet. No-op (returns immediately) once restored, or
   * if no probe is in flight, so it never blocks indefinitely.
   */
  async function ensureSessionRestored(): Promise<void> {
    if (isSessionRestored.value) return
    if (sessionRestorePromise) await sessionRestorePromise
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  /**
   * Local-only session teardown. No network call. Safe to call from the
   * `resumark:session-expired` listener where the server has ALREADY told us
   * the session is gone — calling `/auth/logout` again in that path would
   * just 401 and re-dispatch the event, creating an infinite loop.
   *
   * Synchronous so that any code following the call (e.g. `router.push`) can
   * rely on the storage delegate having been swapped back to LocalStorage
   * before the next view mounts.
   */
  function clearLocalSession(): void {
    setAccessToken(null)
    user.value = null
    isLoggedIn.value = false
    isPremium.value = false
    _switchToLocalStorage()
    // Back on local storage — reload so a still-mounted view drops the cloud
    // user's data instead of leaving it on screen after logout/session-expiry.
    _reloadActiveCV()
  }

  async function logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Best-effort — a 401 here (stale token) is expected and handled by
      // apiClient, which no longer dispatches session-expired for /auth/logout.
    } finally {
      clearLocalSession()
    }
  }

  // ── Upgrade modal ─────────────────────────────────────────────────────────

  function openUpgradeModal(featureName: string): void {
    upgradeModalTrigger.value = featureName
    showUpgradeModal.value = true
  }

  function closeUpgradeModal(): void {
    showUpgradeModal.value = false
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
    clearLocalSession,
    restoreSession,
    ensureSessionRestored,
    openUpgradeModal,
    closeUpgradeModal,
  }
})
