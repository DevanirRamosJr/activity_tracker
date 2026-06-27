import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

try {
  createApp(App).use(router).mount('#app')
} catch (e) {
  // Mount-time failure: surface a readable message instead of a blank page.
  console.error('Failed to start BB - Tracker:', e)
  if (window.__showAppError) window.__showAppError()
}
