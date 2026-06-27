<template>
  <div class="min-h-screen bg-gray-200 dark:bg-gray-900">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 mb-2">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">BB - Tracker</h1>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {{ entries.length }} {{ entries.length === 1 ? t('list.item') : t('list.items') }}
          </p>
        </div>

        <!-- Desktop controls -->
        <div class="hidden sm:flex items-center gap-2">
          <button
            @click="showAdd = true"
            class="bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-white transition-colors"
          >
            {{ t('header.add') }}
          </button>
          <button
            @click="router.push('/draw')"
            class="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-2 transition-colors"
          >
            {{ t('header.draw') }}
          </button>
          <button
            @click="showPassword = true"
            class="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-2 transition-colors"
          >
            {{ t('header.password') }}
          </button>
          <ThemeToggle />
          <button
            @click="toggleLocale"
            class="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded transition-colors"
          >
            {{ locale === 'pt-BR' ? 'EN' : 'PT' }}
          </button>
          <button
            @click="handleLogout"
            class="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-2 transition-colors"
          >
            {{ t('header.logout') }}
          </button>
        </div>

        <!-- Mobile menu -->
        <div class="sm:hidden relative z-30">
          <button
            @click="menuOpen = !menuOpen"
            :aria-expanded="menuOpen"
            aria-label="Menu"
            class="p-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <Transition name="menu-icon" mode="out-in">
              <svg v-if="!menuOpen" key="bars" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else key="close" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </Transition>
          </button>

          <Transition name="menu">
            <div
              v-if="menuOpen"
              class="absolute right-0 mt-2 w-40 origin-top-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 flex flex-col gap-0.5"
            >
              <button @click="showAdd = true; menuOpen = false" :class="menuItem">{{ t('header.add') }}</button>
              <button @click="router.push('/draw')" :class="menuItem">{{ t('header.draw') }}</button>
              <button @click="showPassword = true; menuOpen = false" :class="menuItem">{{ t('header.password') }}</button>
              <div class="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 mt-1 pt-1 px-1">
                <ThemeToggle />
                <button
                  @click="toggleLocale"
                  class="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded transition-colors"
                >
                  {{ locale === 'pt-BR' ? 'EN' : 'PT' }}
                </button>
              </div>
              <button @click="handleLogout" :class="[menuItem, 'border-t border-gray-100 dark:border-gray-700 mt-1 pt-2']">{{ t('header.logout') }}</button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Mobile menu backdrop -->
      <Transition name="fade">
        <div v-if="menuOpen" @click="menuOpen = false" class="fixed inset-0 z-20 sm:hidden"></div>
      </Transition>

      <!-- Search + Sort -->
      <div class="mt-4 mb-5 flex gap-2">
        <input
          v-model="search"
          class="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
          :placeholder="t('list.searchPlaceholder')"
        />
        <select
          v-model="sortBy"
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
        >
          <option v-for="key in sortKeys" :key="key" :value="key">
            {{ t('sort.' + key) }}
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
      <p v-if="loading" class="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">{{ t('list.loading') }}</p>

      <!-- Empty state -->
      <div v-else-if="filtered.length === 0" class="text-center py-16 text-gray-400 dark:text-gray-500">
        <p class="text-4xl mb-3">📋</p>
        <p class="font-medium text-gray-500 dark:text-gray-400">{{ t('list.emptyTitle') }}</p>
        <p class="text-sm mt-1">{{ t('list.emptyHint') }}</p>
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
import { useI18n } from '../composables/useI18n'
import ThemeToggle from '../components/ThemeToggle.vue'
import CategoryFilter from '../components/CategoryFilter.vue'
import EntryCard from '../components/EntryCard.vue'
import AddModal from '../components/AddModal.vue'
import ChangePasswordModal from '../components/ChangePasswordModal.vue'
import { SORT_OPTIONS, filterEntries, sortEntries } from '../lib/entryUtils'

const router = useRouter()
const { currentUser, logout } = useAuth()
const { entries, loading, fetchEntries, addEntry, updateEntry, deleteEntry } = useEntries()
const { categories, fetchCategories } = useCategories()
const { locale, t, setLocale } = useI18n()

const sortKeys = SORT_OPTIONS.map(o => o.value)

const filter = ref([])
const search = ref('')
const sortBy = ref('newest')
const showAdd = ref(false)
const showPassword = ref(false)
const menuOpen = ref(false)

const menuItem = 'w-full text-left text-sm px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'

function toggleLocale() {
  setLocale(locale.value === 'pt-BR' ? 'en' : 'pt-BR')
}

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
  menuOpen.value = false
  logout()
  router.push('/login')
}
</script>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-6px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.menu-icon-enter-active,
.menu-icon-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.menu-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg);
}
.menu-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg);
}
</style>
