<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import { useI18n } from '@/composables/useI18n'
  import { useTypewriter } from '@/composables/useTypewriter'

  const { t } = useI18n()

  const {
    displayed: animatedName,
    isActive: isNameAnimating,
    stop: stopNameAnimation,
  } = useTypewriter('Maya Okafor')

  const {
    displayed: animatedRole,
    isActive: isRoleAnimating,
    stop: stopRoleAnimation,
  } = useTypewriter('Senior Product Designer', { initialDelay: 1400 })

  /**
   * Two-way bindings for the five mini-demo fields. The parent (HomeView)
   * owns the state — it pipes these into cvStore.cvData so every keystroke
   * lands in the user's actual CV and gets auto-saved alongside any work
   * done in /builder.
   *
   * `fullName` writes to cvData.personal.fullName (the headline of the CV).
   * The other four write to cvData.experience[0].* — the row the visitor
   * implicitly "edits" when they fill in this demo.
   *
   * No defaults: empty fields render their placeholders, which mirror the
   * canned LiveCV sample text — so a first-time visitor sees hints in greyed
   * placeholder type without auto-populating their stored CV with sample data.
   */
  const fullName = defineModel<string>('fullName', { default: '' })
  const role = defineModel<string>('role', { default: '' })
  const company = defineModel<string>('company', { default: '' })
  const started = defineModel<string>('started', { default: '' })
  const highlight = defineModel<string>('highlight', { default: '' })

  const totalSteps = 7
  const currentStep = 5
</script>

<!--
  Hero-side mini demo. Looks like one section of the real builder, with a
  writing hint and a progress indicator. Clicking Continue takes you to
  /builder where the real flow starts — the data the visitor types here
  is the same row they'll find pre-filled in /builder's Experience section.
-->
<template>
  <div class="paper-card p-6 demo-float">
    <!-- Eyebrow row -->
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-2">
        <span
          class="w-1.5 h-1.5 rounded-full"
          :style="{ background: 'var(--accent)' }"
          aria-hidden="true"
        />
        <span class="mono-eyebrow">{{ t('home.miniDemo.eyebrow') }}</span>
      </div>
      <span class="mono-eyebrow" :style="{ color: 'var(--accent)' }">
        {{
          t('home.miniDemo.stepLabel', { current: String(currentStep), total: String(totalSteps) })
        }}
      </span>
    </div>

    <!-- Form -->
    <div class="flex flex-col gap-3.5">
      <!--
        Full name is the headline of the CV — kept at the top of the form
        so the visitor's first keystroke lands in the most prominent slot
        of the live preview.
      -->
      <label class="block">
        <span class="mono-eyebrow block mb-1.5">{{ t('home.miniDemo.fields.fullName') }}</span>
        <input
          v-model="fullName"
          type="text"
          :placeholder="isNameAnimating ? animatedName : 'Maya Okafor'"
          autocomplete="name"
          class="w-full text-sm"
          @focus="stopNameAnimation"
        />
      </label>
      <label class="block">
        <span class="mono-eyebrow block mb-1.5">{{ t('home.miniDemo.fields.role') }}</span>
        <input
          v-model="role"
          type="text"
          :placeholder="isRoleAnimating ? animatedRole : 'Senior Product Designer'"
          class="w-full text-sm"
          @focus="stopRoleAnimation"
        />
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="block">
          <span class="mono-eyebrow block mb-1.5">{{ t('home.miniDemo.fields.company') }}</span>
          <input
            v-model="company"
            type="text"
            placeholder="Northwind Studio"
            class="w-full text-sm"
          />
        </label>
        <label class="block">
          <span class="mono-eyebrow block mb-1.5">{{ t('home.miniDemo.fields.started') }}</span>
          <input v-model="started" type="text" placeholder="Mar 2022" class="w-full text-sm" />
        </label>
      </div>
      <label class="block">
        <span class="mono-eyebrow block mb-1.5">{{ t('home.miniDemo.fields.highlight') }}</span>
        <textarea
          v-model="highlight"
          rows="2"
          placeholder="Led the design system migration that cut new-feature design time by 38%."
          class="w-full text-sm resize-none"
        />
      </label>
    </div>

    <!-- Writing hint -->
    <p
      class="mt-4 font-display italic text-[15.5px] leading-snug flex items-start gap-2"
      :style="{ color: 'var(--accent)' }"
    >
      <span class="text-[12px] mt-[3px]" aria-hidden="true">✦</span>
      <span>{{ t('home.miniDemo.hint') }}</span>
    </p>

    <!-- Progress + CTA -->
    <div class="mt-5 pt-4 border-t border-overlay/8 flex items-center justify-between">
      <div class="flex items-center gap-1.5" aria-label="Form progress">
        <span
          v-for="i in totalSteps"
          :key="i"
          class="w-1.5 h-1.5 rounded-full transition-colors"
          :style="{
            background: i <= currentStep ? 'var(--accent)' : 'var(--rule-strong, var(--rule))',
          }"
          aria-hidden="true"
        />
      </div>
      <RouterLink to="/builder" class="btn-primary text-sm">
        <span>{{ t('home.miniDemo.cta') }}</span>
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>
