import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AuthUser {
  name: string
  email: string
}

// Hardcoded dummy accounts — Phase 2: replace with real auth backend
const DUMMY_ACCOUNTS: Record<string, { name: string; isPremium: boolean }> = {
  'test_pro@gmail.com:Pro123':   { name: 'Pro User',  isPremium: true  },
  'test_free@gmail.com:Free123': { name: 'Free User', isPremium: false },
}

export const useUserStore = defineStore('user', () => {
  // Auth state — Phase 2: replace with real auth
  const isLoggedIn = ref(false)
  const user = ref<AuthUser | null>(null)

  const isPremium = ref(false)
  const showUpgradeModal = ref(false)
  const upgradeModalTrigger = ref<string>('')

  const canUploadPhoto = computed(() => isPremium.value)
  const canUseExtraTemplates = computed(() => isPremium.value)

  function login(userData: AuthUser, premium = false): void {
    user.value = userData
    isLoggedIn.value = true
    isPremium.value = premium
  }

  function loginWithCredentials(email: string, password: string): boolean {
    const key = `${email.trim().toLowerCase()}:${password}`
    const account = DUMMY_ACCOUNTS[key]
    if (!account) return false
    login({ name: account.name, email: email.trim().toLowerCase() }, account.isPremium)
    return true
  }

  function logout(): void {
    user.value = null
    isLoggedIn.value = false
    isPremium.value = false
  }

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
    showUpgradeModal,
    upgradeModalTrigger,
    canUploadPhoto,
    canUseExtraTemplates,
    login,
    loginWithCredentials,
    logout,
    openUpgradeModal,
    closeUpgradeModal,
  }
})
