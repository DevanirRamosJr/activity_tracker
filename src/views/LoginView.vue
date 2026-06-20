<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm shadow-sm">
      <h1 class="text-2xl font-semibold text-gray-900 tracking-tight text-center mb-1">BB - Tracker</h1>
      <p class="text-sm text-gray-400 text-center mb-8">Sign in to continue</p>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <input
          v-model="username"
          type="text"
          placeholder="Username"
          autocomplete="username"
          class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
        />
        <PasswordInput
          v-model="password"
          placeholder="Password"
          autocomplete="current-password"
        />

        <p v-if="error" class="text-sm text-red-500 text-center">Invalid credentials</p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import PasswordInput from '../components/PasswordInput.vue'

const router = useRouter()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref(false)
const submitting = ref(false)

async function handleLogin() {
  error.value = false
  submitting.value = true
  const success = await login(username.value, password.value)
  submitting.value = false
  if (success) {
    router.push('/')
  } else {
    error.value = true
  }
}
</script>
