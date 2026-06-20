<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">BB - Tracker</h1>
          <p class="text-sm text-gray-400 mt-0.5">
            {{ entries.length }} {{ entries.length === 1 ? 'entry' : 'entries' }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="showAdd = true"
            class="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + Add
          </button>
          <button
            @click="showPassword = true"
            class="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 transition-colors"
          >
            Password
          </button>
          <button
            @click="handleLogout"
            class="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <!-- Search + Sort -->
      <div class="mt-4 mb-5 flex gap-2">
        <input
          v-model="search"
          class="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
          placeholder="Search titles…"
        />
        <select
          v-model="sortBy"
          class="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-gray-400"
        >
          <option v-for="opt in SORT_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Filter tabs -->
      <CategoryFilter
        v-model="filter"
        :categories="categories"
        :counts="counts"
        :total-count="entries.length"
      />

      <!-- Loading -->
      <p v-if="loading" class="text-gray-400 text-sm py-8 text-center">Loading…</p>

      <!-- Empty state -->
      <div v-else-if="filtered.length === 0" class="text-center py-16 text-gray-400">
        <p class="text-4xl mb-3">📋</p>
        <p class="font-medium text-gray-500">Nothing here yet</p>
        <p class="text-sm mt-1">Add something to get started!</p>
      </div>

      <!-- Entries -->
      <div v-else class="space-y-3">
        <EntryCard
          v-for="entry in filtered"
          :key="entry.id"
          :entry="entry"
          :categories="categories"
          @update="(form) => updateEntry(entry.id, form, entry)"
          @delete="deleteEntry(entry.id)"
        />
      </div>
    </div>

    <AddModal
      v-if="showAdd"
      :categories="categories"
      @close="showAdd = false"
      @add="handleAdd"
    />

    <ChangePasswordModal
      v-if="showPassword"
      @close="showPassword = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useEntries } from '../composables/useEntries'
import { useCategories } from '../composables/useCategories'
import CategoryFilter from '../components/CategoryFilter.vue'
import EntryCard from '../components/EntryCard.vue'
import AddModal from '../components/AddModal.vue'
import ChangePasswordModal from '../components/ChangePasswordModal.vue'
import { SORT_OPTIONS, filterEntries, sortEntries } from '../lib/entryUtils'

const router = useRouter()
const { currentUser, logout } = useAuth()
const { entries, loading, fetchEntries, addEntry, updateEntry, deleteEntry } = useEntries()
const { categories, fetchCategories } = useCategories()

const filter = ref([])
const search = ref('')
const sortBy = ref('newest')
const showAdd = ref(false)
const showPassword = ref(false)

const filtered = computed(() => {
  const result = filterEntries(entries.value, filter.value, search.value)
  return sortEntries(result, sortBy.value, currentUser.value?.id)
})

const counts = computed(() => {
  const acc = {}
  for (const cat of categories.value) {
    acc[cat.name] = entries.value.filter(e => e.category?.name === cat.name).length
  }
  return acc
})

onMounted(async () => {
  await fetchCategories()
  filter.value = categories.value.map(c => c.name)
  fetchEntries()
})

async function handleAdd(form) {
  await addEntry(form)
  showAdd.value = false
}

function handleLogout() {
  logout()
  router.push('/login')
}
</script>
