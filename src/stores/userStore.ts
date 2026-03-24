import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // Phase 1: always false; Phase 2: load from auth/API
  const isPremium = ref(false)
  const showUpgradeModal = ref(false)
  const upgradeModalTrigger = ref<string>('')

  const canUploadPhoto = computed(() => isPremium.value)
  const canUseExtraTemplates = computed(() => isPremium.value)

  function openUpgradeModal(featureName: string): void {
    upgradeModalTrigger.value = featureName
    showUpgradeModal.value = true
  }

  function closeUpgradeModal(): void {
    showUpgradeModal.value = false
    upgradeModalTrigger.value = ''
  }

  return {
    isPremium,
    showUpgradeModal,
    upgradeModalTrigger,
    canUploadPhoto,
    canUseExtraTemplates,
    openUpgradeModal,
    closeUpgradeModal,
  }
})
