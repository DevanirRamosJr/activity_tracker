<template>
  <button
    @click="toggle"
    :aria-label="theme === 'dark' ? 'Light mode' : 'Dark mode'"
    class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 transition-colors"
  >
    <Transition name="theme-icon" mode="out-in">
      <svg v-if="theme === 'dark'" key="sun" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
      </svg>
      <svg v-else key="moon" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />
      </svg>
    </Transition>
  </button>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'

const { theme, toggle } = useTheme()
</script>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.4);
}
.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.4);
}
</style>
