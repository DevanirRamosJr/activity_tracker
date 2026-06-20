<template>
  <div class="space-y-2">
    <label class="text-xs text-gray-400 block">Image</label>

    <!-- Current selection -->
    <div v-if="modelValue" class="relative inline-block">
      <img :src="modelValue" alt="" class="h-28 rounded-lg border border-gray-200 object-cover" />
      <button
        type="button"
        aria-label="Remove image"
        class="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full w-6 h-6 leading-none text-gray-500 hover:text-red-500 shadow-sm"
        @click="$emit('update:modelValue', '')"
      >
        ×
      </button>
    </div>

    <!-- Search + upload controls (stack on mobile so nothing runs off-screen) -->
    <div class="flex flex-col sm:flex-row gap-2">
      <input
        v-model="query"
        placeholder="Search for an image…"
        class="w-full sm:flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
        @input="userEditedQuery = true"
        @keydown.enter.prevent="search"
      />
      <div class="flex gap-2">
        <button
          type="button"
          :disabled="searching || !query.trim()"
          class="flex-1 sm:flex-none text-sm bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
          @click="search"
        >
          {{ searching ? '…' : 'Search' }}
        </button>
        <label class="flex-1 sm:flex-none text-center text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-400 transition-colors whitespace-nowrap">
          {{ uploading ? 'Uploading…' : 'Upload' }}
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

const props = defineProps({
  modelValue: { type: String, default: '' },
  title: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

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

// Mirror the title into the search box in real time, until the user types their
// own query (then we stop overwriting what they typed).
watch(
  () => props.title,
  t => {
    if (!userEditedQuery.value) query.value = t || ''
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
    if (!results.value.length) error.value = 'No images found'
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
