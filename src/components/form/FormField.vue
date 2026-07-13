<!-- Reusable labeled input field with validation -->
<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    id: string
    label: string
    type?: string
    placeholder?: string
    required?: boolean
    error?: string
    hint?: string
    modelValue: string | undefined
    autocomplete?: string
    disabled?: boolean
    /**
     * Hard character cap (native maxlength — blocks new typing but never
     * truncates a pre-filled over-limit value). A counter appears once the
     * value reaches 80% of the cap.
     */
    maxlength?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    required: false,
    disabled: false,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string | undefined]
    blur: []
  }>()

  const charCount = computed(() => props.modelValue?.length ?? 0)
  const showCounter = computed(
    () => props.maxlength !== undefined && charCount.value >= props.maxlength * 0.8,
  )
  const counterClass = computed(() => {
    if (!props.maxlength) return 'text-secondary'
    if (charCount.value >= props.maxlength) return 'text-red-400'
    if (charCount.value >= props.maxlength * 0.9) return 'text-yellow-400'
    return 'text-secondary'
  })
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="id" class="text-xs font-medium text-secondary font-mono uppercase tracking-wider">
      {{ label }}
      <span v-if="required" class="text-accent ml-0.5" aria-hidden="true">*</span>
    </label>

    <textarea
      v-if="type === 'textarea'"
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :maxlength="maxlength"
      :aria-required="required"
      :aria-describedby="
        error ? `${id}-error` : hint ? `${id}-hint` : showCounter ? `${id}-count` : undefined
      "
      :aria-invalid="!!error"
      :autocomplete="autocomplete"
      class="w-full px-3 py-2 text-sm rounded-lg resize-none min-h-[80px]"
      :class="error ? 'border-red-500/50' : ''"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="emit('blur')"
    />

    <input
      v-else
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :maxlength="maxlength"
      :aria-required="required"
      :aria-describedby="
        error ? `${id}-error` : hint ? `${id}-hint` : showCounter ? `${id}-count` : undefined
      "
      :aria-invalid="!!error"
      :autocomplete="autocomplete"
      class="w-full px-3 py-2 text-sm rounded-lg"
      :class="[error ? 'border-red-500/50' : '', disabled ? 'opacity-40 cursor-not-allowed' : '']"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur')"
    />

    <p
      v-if="error"
      :id="`${id}-error`"
      class="text-xs text-red-400 flex items-center gap-1"
      role="alert"
    >
      <svg
        class="w-3 h-3 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-xs text-secondary">
      {{ hint }}
    </p>
    <p
      v-else-if="showCounter"
      :id="`${id}-count`"
      class="text-xs font-mono text-right tabular-nums"
      :class="counterClass"
      aria-live="polite"
    >
      {{ charCount }}/{{ maxlength }}
    </p>
  </div>
</template>
