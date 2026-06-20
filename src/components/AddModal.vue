<template>
  <div
    class="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t('addModal.title') }}</h2>
      <div class="space-y-3">
        <input
          ref="titleInput"
          v-model="form.title"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          :placeholder="t('addModal.titlePlaceholder')"
          @keydown.enter="submit"
        />
        <div class="flex gap-2">
          <select
            v-model="form.category_id"
            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          >
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <select
            v-model="form.status"
            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          >
            <option v-for="s in STATUSES" :key="s">{{ s }}</option>
          </select>
        </div>
        <div class="flex gap-2">
          <div class="flex-1">
            <label class="text-xs text-gray-400 mb-1 block">{{ t('addModal.desireLabel') }}</label>
            <select
              v-model.number="form.desire_level"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            >
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="text-xs text-gray-400 mb-1 block">{{ t('addModal.ratingLabel') }}</label>
            <select
              v-model.number="form.rating"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            >
              <option :value="0">{{ t('addModal.noRating') }}</option>
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>
        <ImagePicker v-model="form.image_url" :title="form.title" />
        <textarea
          v-model="form.notes"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
          rows="2"
          :placeholder="t('addModal.notes')"
        />
      </div>
      <div class="flex justify-end gap-2 mt-5">
        <button @click="$emit('close')" class="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 transition-colors">
          {{ t('addModal.cancel') }}
        </button>
        <button
          @click="submit"
          :disabled="!form.title.trim() || submitting"
          class="text-sm bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-30"
        >
          {{ submitting ? t('addModal.submitting') : t('addModal.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import { STATUSES } from '../constants'
import { useI18n } from '../composables/useI18n'
import ImagePicker from './ImagePicker.vue'

const props = defineProps({
  categories: { type: Array, required: true },
})
const emit = defineEmits(['close', 'add'])
const { t } = useI18n()

const titleInput = ref(null)
const submitting = ref(false)
const form = reactive({
  title: '', category_id: '', status: 'Want to', notes: '',
  desire_level: 5, rating: 0, image_url: '',
})

watch(() => props.categories, (cats) => {
  if (cats.length && !form.category_id) {
    form.category_id = cats[0].id
  }
}, { immediate: true })

onMounted(() => titleInput.value?.focus())

async function submit() {
  if (!form.title.trim()) return
  submitting.value = true
  await emit('add', { ...form, rating: form.rating || null })
  submitting.value = false
}
</script>
