<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm shadow-sm">
      <h1 class="text-2xl font-semibold text-gray-900 tracking-tight text-center mb-1">BB - Tracker</h1>
      <p class="text-sm text-gray-400 text-center mb-6">{{ t('login.subtitle') }}</p>

      <div class="flex justify-center mb-6">
        <button
          v-for="l in ['pt-BR', 'en']"
          :key="l"
          @click="setLocale(l)"
          :class="[
            'px-3 py-1 text-xs font-medium border transition-colors',
            l === 'pt-BR' ? 'rounded-l-lg' : 'rounded-r-lg',
            locale === l
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400',
          ]"
        >
          {{ l === 'pt-BR' ? 'PT' : 'EN' }}
        </button>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <input
          v-model="username"
          type="text"
          :placeholder="t('login.username')"
          autocomplete="username"
          class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
        />
        <PasswordInput
          v-model="password"
          :placeholder="t('login.password')"
          autocomplete="current-password"
        />

        <p v-if="error" class="text-sm text-red-500 text-center">{{ t('login.error') }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {{ submitting ? t('login.submitting') : t('login.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useI18n } from '../composables/useI18n'
import PasswordInput from '../components/PasswordInput.vue'

const router = useRouter()
const { login } = useAuth()
const { locale, t, setLocale } = useI18n()

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
