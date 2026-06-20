<template>
  <div
    class="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Change password</h2>

      <form @submit.prevent="submit" class="space-y-3">
        <PasswordInput
          ref="currentInput"
          v-model="currentPassword"
          autocomplete="current-password"
          placeholder="Current password"
        />
        <PasswordInput
          v-model="newPassword"
          autocomplete="new-password"
          placeholder="New password"
        />
        <PasswordInput
          v-model="confirmPassword"
          autocomplete="new-password"
          placeholder="Confirm new password"
        />

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <p v-if="success" class="text-sm text-emerald-600">Password updated.</p>

        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            @click="$emit('close')"
            class="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 transition-colors"
          >
            {{ success ? 'Close' : 'Cancel' }}
          </button>
          <button
            v-if="!success"
            type="submit"
            :disabled="submitting"
            class="text-sm bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {{ submitting ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import PasswordInput from './PasswordInput.vue'

const emit = defineEmits(['close'])
const { changePassword } = useAuth()

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
    return 'All fields are required'
  }
  if (newPassword.value.length < 4) {
    return 'New password must be at least 4 characters'
  }
  if (newPassword.value !== confirmPassword.value) {
    return 'New passwords do not match'
  }
  if (newPassword.value === currentPassword.value) {
    return 'New password must be different from the current one'
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
    error.value = result?.error || 'Could not change password'
  }
}
</script>
