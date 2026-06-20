import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: parseInt(process.env.PORT) || 5173,
    strictPort: true,
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
