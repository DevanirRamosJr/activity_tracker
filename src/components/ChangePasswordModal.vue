<template>
  <div
    class="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('password.title') }}</h2>

      <form @submit.prevent="submit" class="space-y-3">
        <PasswordInput
          ref="currentInput"
          v-model="currentPassword"
          autocomplete="current-password"
          :placeholder="t('password.current')"
        />
        <PasswordInput
          v-model="newPassword"
          autocomplete="new-password"
          :placeholder="t('password.new')"
        />
        <PasswordInput
          v-model="confirmPassword"
          autocomplete="new-password"
          :placeholder="t('password.confirm')"
        />

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <p v-if="success" class="text-sm text-emerald-600">{{ t('password.success') }}</p>

        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            @click="$emit('close')"
            class="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 transition-colors"
          >
            {{ success ? t('password.close') : t('password.cancel') }}
          </button>
          <button
            v-if="!success"
            type="submit"
            :disabled="submitting"
            class="text-sm bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {{ submitting ? t('password.saving') : t('password.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useI18n } from '../composables/useI18n'
import PasswordInput from './PasswordInput.vue'

const emit = defineEmits(['close'])
const { changePassword } = useAuth()
const { t } = useI18n()

const currentInput = ref(null)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref(false)
const submitting = ref(false)

onMounted(() => currentInput.value?.focus())

function validate() {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    return t('password.required')
  }
  if (newPassword.value.length < 4) {
    return t('password.tooShort')
  }
  if (newPassword.value !== confirmPassword.value) {
    return t('password.mismatch')
  }
  if (newPassword.value === currentPassword.value) {
    return t('password.same')
  }
  return ''
}

async function submit() {
  error.value = ''
  const validationError = validate()
  if (validationError) {
    error.value = validationError
    return
  }

  submitting.value = true
  const result = await changePassword(currentPassword.value, newPassword.value)
  submitting.value = false

  if (result?.success) {
    success.value = true
  } else {
    error.value = result?.error || t('password.fallbackError')
  }
}
</script>
