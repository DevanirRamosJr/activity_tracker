<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-sm">
    <!-- Edit mode -->
    <div v-if="editing" class="space-y-3">
      <input
        ref="titleInput"
        v-model="form.title"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
        :placeholder="t('card.title')"
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
          <label class="text-xs text-gray-400 mb-1 block">{{ t('card.desire') }} (1-10)</label>
          <select
            v-model.number="form.desire_level"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          >
            <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="text-xs text-gray-400 mb-1 block">{{ t('card.rating') }} (1-10)</label>
          <select
            v-model.number="form.rating"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          >
            <option :value="0">{{ t('card.noRating') }}</option>
            <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>
      <ImagePicker v-model="form.image_url" :title="form.title" />
      <textarea
        v-model="form.notes"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
        rows="2"
        :placeholder="t('card.notes')"
      />
      <div class="flex justify-end gap-2">
        <button @click="editing = false" class="text-sm text-gray-400 hover:text-gray-700 px-3 py-1.5 transition-colors">
          {{ t('card.cancel') }}
        </button>
        <button
          @click="save"
          class="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {{ t('card.save') }}
        </button>
      </div>
    </div>

    <!-- View mode -->
    <template v-else>
      <div class="flex items-start justify-between gap-3">
        <img
          v-if="entry.image_url"
          :src="entry.image_url"
          alt=""
          class="w-14 h-20 object-cover rounded-md border border-gray-200 shrink-0"
        />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">{{ entry.title }}</p>
          <div class="flex flex-wrap gap-1.5 mt-1.5">
            <span
              v-if="entry.category"
              :class="['text-xs px-2 py-0.5 rounded-full font-medium', entry.category.color_bg, entry.category.color_text]"
            >
              {{ entry.category.name }}
            </span>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[entry.status]]">
              {{ entry.status }}
            </span>
            <span v-if="myScore" class="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
              {{ t('card.desire') }} {{ myScore.desire_level }}/10
            </span>
            <span v-if="myScore?.rating" class="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600">
              {{ t('card.rating') }} {{ myScore.rating }}/10
            </span>
          </div>
          <p v-if="entry.notes" class="text-sm text-gray-500 mt-2 leading-relaxed">{{ entry.notes }}</p>

          <div v-if="otherScores.length" class="mt-2 space-y-0.5">
            <p v-for="s in otherScores" :key="s.id" class="text-xs text-gray-400">
              <span class="font-medium text-gray-500">{{ s.user?.username }}</span>
              · {{ t('card.desire') }} {{ s.desire_level }}/10<span v-if="s.rating"> · {{ t('card.rating') }} {{ s.rating }}/10</span>
            </p>
          </div>

          <p class="text-xs text-gray-400 mt-2">{{ t('card.addedAt') }} {{ formatDate(entry.created_at, dateLocale()) }}</p>
        </div>
        <div class="flex gap-3 shrink-0 pt-0.5">
          <button @click="startEdit" class="text-xs text-gray-400 hover:text-gray-800 transition-colors">{{ t('card.edit') }}</button>
          <button v-if="isOwner" @click="confirming = true" class="text-xs text-gray-400 hover:text-red-500 transition-colors">{{ t('card.delete') }}</button>
        </div>
      </div>

      <!-- History -->
      <div class="mt-3 pt-3 border-t border-gray-100">
        <button
          @click="expanded = !expanded"
          class="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors"
        >
          <span>{{ expanded ? '▲' : '▼' }}</span>
          <span>{{ t('card.history') }} · {{ entry.history.length }} {{ entry.history.length === 1 ? t('card.event') : t('card.events') }}</span>
        </button>
        <ul v-if="expanded" class="mt-2.5 space-y-1.5 pl-3 border-l-2 border-gray-100">
          <li v-for="(h, i) in entry.history" :key="i" class="text-xs text-gray-500 flex flex-col gap-0.5">
            <span class="text-gray-400">
              {{ formatDate(h.created_at, dateLocale()) }}
              <span v-if="h.user?.username" class="font-medium text-gray-500"> · {{ h.user.username }}</span>
            </span>
            <span>{{ h.description }}</span>
          </li>
        </ul>
      </div>
    </template>

    <ConfirmDialog
      v-if="confirming"
      :message="t('card.deleteConfirm')"
      :confirm-label="t('card.delete')"
      :cancel-label="t('card.cancel')"
      @confirm="confirmDelete"
      @cancel="confirming = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, computed } from 'vue'
import { STATUSES, STATUS_COLORS, formatDate } from '../constants'
import { useAuth } from '../composables/useAuth'
import { useI18n } from '../composables/useI18n'
import ImagePicker from './ImagePicker.vue'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps({
  entry: { type: Object, required: true },
  categories: { type: Array, required: true },
})
const emit = defineEmits(['update', 'delete'])

const { currentUser } = useAuth()
const { t, dateLocale } = useI18n()

const myScore = computed(() =>
  props.entry.scores?.find(s => s.user_id === currentUser.value?.id)
)

const otherScores = computed(() =>
  (props.entry.scores || []).filter(s => s.user_id !== currentUser.value?.id)
)

const isOwner = computed(() => props.entry.user_id === currentUser.value?.id)

const editing = ref(false)
const expanded = ref(false)
const confirming = ref(false)
const titleInput = ref(null)
const form = reactive({
  title: '', category_id: '', status: '', notes: '',
  desire_level: 5, rating: 0, image_url: '',
})

function startEdit() {
  form.title = props.entry.title
  form.category_id = props.entry.category?.id || ''
  form.status = props.entry.status
  form.notes = props.entry.notes || ''
  form.desire_level = myScore.value?.desire_level || 5
  form.rating = myScore.value?.rating || 0
  form.image_url = props.entry.image_url || ''
  editing.value = true
  nextTick(() => titleInput.value?.focus())
}

function save() {
  emit('update', { ...form, rating: form.rating || null })
  editing.value = false
}

function confirmDelete() {
  confirming.value = false
  emit('delete')
}
</script>
