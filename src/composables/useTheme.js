import { ref } from 'vue'
import { getItem, setItem } from '../lib/safeStorage'

function initialTheme() {
  const saved = getItem('theme')
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref(initialTheme())
apply()

function apply() {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
}

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    setItem('theme', theme.value)
    apply()
  }

  return { theme, toggle }
}
