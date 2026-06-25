<template>
  <div class="space-y-2">
    <label class="text-xs text-gray-400 block">{{ t('image.label') }}</label>

    <!-- Current selection -->
    <div v-if="modelValue" class="relative inline-block">
      <img :src="modelValue" alt="" class="h-28 rounded-lg border border-gray-200 dark:border-gray-700 object-cover" />
      <button
        type="button"
        :aria-label="t('image.remove')"
        class="absolute -top-2 -right-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full w-6 h-6 leading-none text-gray-500 dark:text-gray-300 hover:text-red-500 shadow-sm"
        @click="$emit('update:modelValue', '')"
      >
        ×
      </button>
    </div>

    <!-- Search + upload controls (stack on mobile so nothing runs off-screen) -->
    <div class="flex flex-col sm:flex-row gap-2">
      <input
        v-model="query"
        :placeholder="t('image.searchPlaceholder')"
        class="w-full sm:flex-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
        @input="userEditedQuery = true"
        @keydown.enter.prevent="search"
      />
      <div class="flex gap-2">
        <button
          type="button"
          :disabled="searching || !query.trim()"
          class="flex-1 sm:flex-none text-sm bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-white transition-colors disabled:opacity-40"
          @click="search"
        >
          {{ searching ? '…' : t('image.search') }}
        </button>
        <label class="flex-1 sm:flex-none text-center text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors whitespace-nowrap">
          {{ uploading ? t('image.uploading') : t('image.upload') }}
          <input type="file" accept="image/*" class="hidden" @change="onUpload" />
        </label>
      </div>
    </div>

    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

    <!-- Search results (fewer, larger thumbnails on mobile) -->
    <div v-if="results.length" class="grid grid-cols-3 sm:grid-cols-5 gap-2">
      <button
        v-for="(r, i) in results"
        v-show="!failed.has(r.url)"
        :key="i"
        type="button"
        :title="r.title"
        class="border border-gray-200 rounded-lg overflow-hidden hover:ring-2 ring-gray-400 focus:outline-none focus:ring-2"
        @click="pick(r.url)"
      >
        <img :src="r.thumbnail" :alt="r.title" class="w-full h-24 sm:h-20 object-cover" @error="markFailed(r.url)" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { searchImages } from '../lib/imageSearch'
import { uploadImage } from '../lib/storage'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  modelValue: { type: String, default: '' },
  title: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const query = ref(props.title || '')
const results = ref([])
const failed = ref(new Set())
const searching = ref(false)
const uploading = ref(false)
const error = ref('')
const userEditedQuery = ref(false)

function markFailed(url) {
  failed.value = new Set(failed.value).add(url)
}

watch(
  () => props.title,
  val => {
    if (!userEditedQuery.value) query.value = val || ''
  }
)

async function search() {
  if (!query.value.trim()) return
  error.value = ''
  searching.value = true
  results.value = []
  failed.value = new Set()
  try {
    results.value = await searchImages(query.value)
    if (!results.value.length) error.value = t('image.noResults')
  } catch (e) {
    error.value = e.message
  } finally {
    searching.value = false
  }
}

function pick(url) {
  emit('update:modelValue', url)
  results.value = []
}

async function onUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  error.value = ''
  uploading.value = true
  try {
    const url = await uploadImage(file)
    emit('update:modelValue', url)
  } catch (e) {
    error.value = e.message
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}
</script>
