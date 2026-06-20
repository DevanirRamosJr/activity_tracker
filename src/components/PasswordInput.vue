<template>
  <div class="relative">
    <input
      ref="inputEl"
      :type="visible ? 'text' : 'password'"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      class="w-full border border-gray-200 rounded-lg pl-3 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <button
      type="button"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
      @click="visible = !visible"
    >
      <!-- Eye (visible) -->
      <svg v-if="visible" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.5 12S5.5 5.5 12 5.5 21.5 12 21.5 12 18.5 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <!-- Eye-off (hidden) -->
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 5.6A9.5 9.5 0 0112 5.5c6.5 0 9.5 6.5 9.5 6.5a16 16 0 01-2.9 3.8M6.2 6.2A16 16 0 002.5 12S5.5 18.5 12 18.5c1 0 1.9-.1 2.7-.4" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'current-password' },
})
defineEmits(['update:modelValue'])

const visible = ref(false)
const inputEl = ref(null)

defineExpose({ focus: () => inputEl.value?.focus() })
</script>
