import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AuthUser {
  name: string
  email: string
}

export const useUserStore = defineStore('user', () => {
  // Auth state — Phase 2: replace with real auth
  const isLoggedIn = ref(false)
  const user = ref<AuthUser | null>(null)

  // Phase 1: always false; Phase 2: load from auth/API
  const isPremium = ref(false)
  const showUpgradeModal = ref(false)
  const upgradeModalTrigger = ref<string>('')

  const canUploadPhoto = computed(() => isPremium.value)
  const canUseExtraTemplates = computed(() => isPremium.value)

  function login(userData: AuthUser): void {
    user.value = userData
    isLoggedIn.value = true
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
    logout,
    openUpgradeModal,
    closeUpgradeModal,
  }
})
