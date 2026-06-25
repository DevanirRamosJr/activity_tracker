<template>
  <div
    class="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <p class="text-sm text-gray-800 dark:text-gray-200 mb-5">{{ message }}</p>
      <div class="flex justify-end gap-2">
        <button
          @click="$emit('cancel')"
          class="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-2 transition-colors"
        >
          {{ cancelLabel }}
        </button>
        <button
          @click="$emit('confirm')"
          class="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  cancelLabel: { type: String, required: true },
})
defineEmits(['confirm', 'cancel'])
</script>
