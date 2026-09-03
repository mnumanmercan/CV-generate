<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useCVStore } from '@/stores/cvStore'
  import { useUserStore } from '@/stores/userStore'
  import { useI18n } from '@/composables/useI18n'
  import ConfirmModal from '@/components/ui/ConfirmModal.vue'
  import { CV_VARIANT_LIMIT, CV_LIMITS } from '@resumark/shared'

  const cvStore = useCVStore()
  const userStore = useUserStore()
  const { t } = useI18n()

  const { variants, activeVariantId, switchingVariant } = storeToRefs(cvStore)

  // Free and guest accounts hold exactly one CV, so the strip renders a single
  // tab plus a locked "+" that routes into the existing upgrade flow.
  const canAdd = computed(
    () => userStore.isPremium && cvStore.canUseVariants && variants.value.length < CV_VARIANT_LIMIT,
  )
  const atLimit = computed(() => userStore.isPremium && variants.value.length >= CV_VARIANT_LIMIT)

  // The strip is pointless with a single unnamed CV — it only appears once the
  // user actually has variants, or is a Pro user who could create one.
  const visible = computed(() => variants.value.length > 1 || userStore.isPremium)

  function select(id: string): void {
    if (id === activeVariantId.value || switchingVariant.value) return
    void cvStore.switchVariant(id)
  }

  function onKeydown(event: KeyboardEvent): void {
    const list = variants.value
    const idx = list.findIndex((v) => v.id === activeVariantId.value)
    if (idx < 0) return
    let next: number
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      next = (idx + 1) % list.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      next = (idx - 1 + list.length) % list.length
    } else {
      return
    }
    const target = list[next]
    if (target) select(target.id)
  }

  /* ── Create ───────────────────────────────────────────────── */
  const showAdd = ref(false)
  const newName = ref('')
  const addBusy = ref(false)
  const addInputEl = ref<HTMLInputElement | null>(null)

  function onAddClick(): void {
    if (!userStore.isPremium) {
      // Trigger string matches the locked tile already wired in DashboardView.
      userStore.openUpgradeModal('Multiple CVs')
      return
    }
    if (atLimit.value) return
    newName.value = t('builder.variants.defaultName', { n: String(variants.value.length + 1) })
    showAdd.value = true
    void nextTick(() => addInputEl.value?.select())
  }

  async function confirmAdd(): Promise<void> {
    if (addBusy.value) return
    addBusy.value = true
    try {
      const id = await cvStore.createVariant(newName.value.trim() || 'CV')
      // null means the server rejected on the plan cap — surface the upgrade
      // path rather than a silent no-op.
      if (!id) userStore.openUpgradeModal('Multiple CVs')
      showAdd.value = false
    } finally {
      addBusy.value = false
    }
  }

  /* ── Rename ───────────────────────────────────────────────── */
  const renamingId = ref<string | null>(null)
  const renameDraft = ref('')
  const renameInputEl = ref<HTMLInputElement | null>(null)

  function startRename(id: string, current: string): void {
    renamingId.value = id
    renameDraft.value = current
    void nextTick(() => renameInputEl.value?.select())
  }

  async function commitRename(): Promise<void> {
    const id = renamingId.value
    renamingId.value = null
    if (!id) return
    const next = renameDraft.value.trim()
    const previous = variants.value.find((v) => v.id === id)?.title
    if (!next || next === previous) return
    try {
      await cvStore.renameVariant(id, next)
    } catch {
      // Non-fatal — the strip keeps the old name and the user can retry.
    }
  }

  /* ── Delete ───────────────────────────────────────────────── */
  const pendingDeleteId = ref<string | null>(null)
  const pendingDeleteName = computed(
    () => variants.value.find((v) => v.id === pendingDeleteId.value)?.title ?? '',
  )

  async function confirmDelete(): Promise<void> {
    const id = pendingDeleteId.value
    pendingDeleteId.value = null
    if (!id) return
    try {
      await cvStore.deleteVariant(id)
    } catch {
      /* non-fatal */
    }
  }
</script>

<!--
  CV version tabs.

  Each tab is a complete, standalone CV row — switching swaps the whole active
  document, so the preview follows automatically with no preview-side work.
  Follows the radiogroup idiom from BuilderToolSwitcher's template picker:
  arrow-key navigation, sienna fill on the active pill, Pro badge on the
  locked action.
-->
<template>
  <div v-if="visible" class="mb-6">
    <p class="mono-eyebrow mb-2.5">{{ t('builder.variants.eyebrow') }}</p>

    <div
      class="flex items-center gap-1.5 flex-wrap"
      role="radiogroup"
      :aria-label="t('builder.variants.groupLabel')"
      @keydown="onKeydown"
    >
      <template v-for="variant in variants" :key="variant.id">
        <!-- Inline rename: the tab becomes its own input in place -->
        <input
          v-if="renamingId === variant.id"
          ref="renameInputEl"
          v-model="renameDraft"
          type="text"
          :maxlength="CV_LIMITS.cvTitle"
          :aria-label="t('builder.variants.renameLabel')"
          class="px-3 py-1 rounded-full text-[12.5px] font-medium text-ink border bg-[var(--paper)] focus:outline-none min-w-0 w-40"
          :style="{ borderColor: 'var(--accent)' }"
          @blur="commitRename"
          @keydown.enter.prevent="commitRename"
          @keydown.esc.prevent="renamingId = null"
        />

        <div v-else class="relative flex items-center group/tab">
          <button
            type="button"
            role="radio"
            :aria-checked="activeVariantId === variant.id"
            :tabindex="activeVariantId === variant.id ? 0 : -1"
            :disabled="switchingVariant"
            :class="[
              'flex items-center gap-1.5 pl-3.5 py-1 rounded-full text-[12.5px] font-medium transition-colors whitespace-nowrap max-w-[190px] disabled:opacity-60',
              activeVariantId === variant.id
                ? 'text-white pr-2'
                : 'text-muted hover:text-ink hover:bg-overlay/5 pr-3.5',
            ]"
            :style="activeVariantId === variant.id ? { background: 'var(--accent)' } : {}"
            :title="variant.title"
            @click="select(variant.id)"
            @dblclick="startRename(variant.id, variant.title)"
          >
            <span class="truncate">{{ variant.title }}</span>

            <!--
              Rename + delete only on the active tab: a row of icons on every
              pill would turn the strip into a control panel, and both actions
              are things you do to the version you are looking at.
            -->
            <span
              v-if="activeVariantId === variant.id"
              class="flex items-center gap-0.5 shrink-0"
              @click.stop
            >
              <span
                role="button"
                tabindex="0"
                class="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer"
                :aria-label="t('builder.variants.renameLabel')"
                :title="t('builder.variants.renameLabel')"
                @click="startRename(variant.id, variant.title)"
                @keydown.enter.prevent="startRename(variant.id, variant.title)"
                @keydown.space.prevent="startRename(variant.id, variant.title)"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16.862 4.487a2.1 2.1 0 112.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z"
                  />
                </svg>
              </span>
              <span
                v-if="variants.length > 1"
                role="button"
                tabindex="0"
                class="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer"
                :aria-label="t('builder.variants.deleteLabel')"
                :title="t('builder.variants.deleteLabel')"
                @click="pendingDeleteId = variant.id"
                @keydown.enter.prevent="pendingDeleteId = variant.id"
                @keydown.space.prevent="pendingDeleteId = variant.id"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </span>
            </span>
          </button>
        </div>
      </template>

      <!-- Add — locked for free/guest, disabled at the cap -->
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-medium transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
        :class="
          canAdd || !userStore.isPremium
            ? 'text-muted hover:text-ink hover:bg-overlay/5'
            : 'text-muted'
        "
        :disabled="atLimit"
        :title="atLimit ? t('builder.variants.limitReached', { n: String(CV_VARIANT_LIMIT) }) : ''"
        :aria-label="t('builder.variants.addLabel')"
        @click="onAddClick"
      >
        <span aria-hidden="true">+</span>
        {{ t('builder.variants.addLabel') }}
        <span
          v-if="!userStore.isPremium"
          class="mono-eyebrow text-[9.5px] px-1.5 py-[3px] rounded text-white"
          :style="{ background: 'var(--accent)' }"
          >Pro</span
        >
      </button>
    </div>

    <p v-if="atLimit" class="mono-eyebrow text-[10px] mt-2 text-muted">
      {{ t('builder.variants.limitReached', { n: String(CV_VARIANT_LIMIT) }) }}
    </p>

    <!-- Name-this-version popover -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showAdd"
          class="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style="background: rgba(0, 0, 0, 0.35)"
          role="dialog"
          aria-modal="true"
          :aria-label="t('builder.variants.addTitle')"
          @click.self="showAdd = false"
          @keydown.esc="showAdd = false"
        >
          <div class="paper-card p-6 w-full max-w-sm">
            <h3 class="font-display text-[20px] leading-[1.15] tracking-editorial text-ink mb-1">
              {{ t('builder.variants.addTitle') }}
            </h3>
            <p class="text-[13px] text-muted leading-[1.55] mb-4">
              {{ t('builder.variants.syncedHint') }}
            </p>
            <input
              ref="addInputEl"
              v-model="newName"
              type="text"
              :maxlength="CV_LIMITS.cvTitle"
              :placeholder="t('builder.variants.addPlaceholder')"
              class="w-full rounded-lg px-3 py-2 text-[13.5px] text-ink border border-overlay/15 bg-[var(--paper)] focus:outline-none focus:border-[var(--accent)] mb-4"
              @keydown.enter.prevent="confirmAdd"
            />
            <div class="flex items-center justify-end gap-2">
              <button type="button" class="btn-ghost text-[13px]" @click="showAdd = false">
                {{ t('builder.variants.addCancel') }}
              </button>
              <button
                type="button"
                class="btn-primary text-[13px]"
                :disabled="addBusy"
                @click="confirmAdd"
              >
                {{ t('builder.variants.addConfirm') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmModal
      :visible="pendingDeleteId !== null"
      :title="t('builder.variants.deleteTitle', { name: pendingDeleteName })"
      :message="t('builder.variants.deleteMessage')"
      :confirm-label="t('builder.variants.deleteConfirm')"
      @confirm="confirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
