<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">{{ t('draw.title') }}</h1>
        <button
          @click="router.push('/')"
          class="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 transition-colors"
        >
          ← {{ t('draw.back') }}
        </button>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-5">
        <!-- Status filter -->
        <div>
          <p class="text-xs text-gray-400 mb-2">{{ t('draw.statuses') }}</p>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="s in STATUSES"
              :key="s"
              @click="toggle(selectedStatuses, s)"
              :class="chipClass(selectedStatuses.includes(s), STATUS_COLORS[s])"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Category filter -->
        <div>
          <p class="text-xs text-gray-400 mb-2">{{ t('draw.categories') }}</p>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="c in categories"
              :key="c.id"
              @click="toggle(selectedCategories, c.name)"
              :class="chipClass(selectedCategories.includes(c.name), c.color_bg + ' ' + c.color_text)"
            >
              {{ c.name }}
            </button>
          </div>
        </div>

        <!-- Desire weighting -->
        <div class="border-t border-gray-100 pt-4">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" v-model="desire.enabled" class="rounded" />
            {{ t('draw.useDesire') }}
          </label>
          <label v-if="desire.enabled" class="flex items-center gap-2 text-sm text-gray-500 mt-2 ml-6">
            <input type="checkbox" v-model="desire.invert" class="rounded" />
            {{ t('draw.invert') }}
          </label>
          <p v-if="desire.enabled" class="text-xs text-gray-400 mt-1 ml-6">
            {{ desire.invert ? t('draw.desireHintInverted') : t('draw.desireHint') }}
          </p>
        </div>

        <!-- Date weighting -->
        <div class="border-t border-gray-100 pt-4">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" v-model="date.enabled" class="rounded" />
            {{ t('draw.useDate') }}
          </label>
          <label v-if="date.enabled" class="flex items-center gap-2 text-sm text-gray-500 mt-2 ml-6">
            <input type="checkbox" v-model="date.invert" class="rounded" />
            {{ t('draw.invert') }}
          </label>
          <p v-if="date.enabled" class="text-xs text-gray-400 mt-1 ml-6">
            {{ date.invert ? t('draw.dateHintInverted') : t('draw.dateHint') }}
          </p>
        </div>

        <!-- Show images on wheel -->
        <div class="border-t border-gray-100 pt-4">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" v-model="showImages" class="rounded" />
            {{ t('draw.showImages') }}
          </label>
        </div>

        <!-- Draw button -->
        <div class="border-t border-gray-100 pt-4 flex items-center justify-between">
          <span class="text-xs text-gray-400">{{ eligibleCount }} {{ t('draw.eligible') }}</span>
          <button
            @click="doDraw"
            :disabled="eligibleCount === 0 || spinning"
            class="bg-gray-900 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-30"
          >
            {{ result ? t('draw.again') : t('draw.button') }}
          </button>
        </div>
      </div>

      <!-- Wheel -->
      <div v-if="eligibleCount > 0" class="mt-6">
        <DrawWheel ref="wheel" :segments="segments" :show-images="showImages" @done="onWheelDone" />
      </div>

      <!-- Empty -->
      <p v-if="drawn && eligibleCount === 0" class="text-center text-gray-400 text-sm py-8">
        {{ t('draw.empty') }}
      </p>

      <!-- Result -->
      <div v-if="result" class="mt-6">
        <p class="text-xs text-gray-400 mb-2">{{ t('draw.result') }}</p>
        <div class="bg-white rounded-xl border-2 border-gray-900 p-4 flex items-start gap-3">
          <img
            v-if="result.image_url"
            :src="result.image_url"
            alt=""
            class="w-20 h-28 object-cover rounded-md border border-gray-200 shrink-0"
          />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 text-lg">{{ result.title }}</p>
            <div class="flex flex-wrap gap-1.5 mt-2">
              <span
                v-if="result.category"
                :class="['text-xs px-2 py-0.5 rounded-full font-medium', result.category.color_bg, result.category.color_text]"
              >
                {{ result.category.name }}
              </span>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[result.status]]">
                {{ result.status }}
              </span>
              <span v-if="avgDesire(result)" class="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
                {{ t('card.desire') }} {{ avgDesire(result) }}/10
              </span>
            </div>
            <p v-if="result.notes" class="text-sm text-gray-500 mt-2 leading-relaxed">{{ result.notes }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ t('card.addedAt') }} {{ formatDate(result.created_at, dateLocale()) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useEntries } from '../composables/useEntries'
import { useCategories } from '../composables/useCategories'
import { useI18n } from '../composables/useI18n'
import { STATUSES, STATUS_COLORS, formatDate } from '../constants'
import { getAvgScore } from '../lib/entryUtils'
import { computeWeights, drawEntry, wheelSegments } from '../lib/draw'
import DrawWheel from '../components/DrawWheel.vue'

const router = useRouter()
const { entries, fetchEntries } = useEntries()
const { categories, fetchCategories } = useCategories()
const { t, dateLocale } = useI18n()

const selectedStatuses = ref([...STATUSES])
const selectedCategories = ref([])
const desire = reactive({ enabled: false, invert: false })
const date = reactive({ enabled: false, invert: false })
const showImages = ref(false)

const result = ref(null)
const drawn = ref(false)
const spinning = ref(false)
const wheel = ref(null)
let pendingWinner = null

const options = computed(() => ({
  statuses: selectedStatuses.value,
  categories: selectedCategories.value,
  desire,
  date,
}))

const weighted = computed(() => computeWeights(entries.value, options.value))
const segments = computed(() => wheelSegments(weighted.value))
const eligibleCount = computed(() => weighted.value.length)

function toggle(list, value) {
  const idx = list.indexOf(value)
  if (idx === -1) list.push(value)
  else list.splice(idx, 1)
}

function chipClass(active, colorClasses) {
  return [
    'px-3 py-1 rounded-full text-sm font-medium transition-colors border',
    active ? `${colorClasses} border-current` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400',
  ]
}

function avgDesire(entry) {
  const v = getAvgScore(entry, 'desire_level')
  return v ? Math.round(v * 10) / 10 : 0
}

async function doDraw() {
  if (spinning.value) return
  const winner = drawEntry(entries.value, options.value)
  if (!winner) return

  const idx = weighted.value.findIndex(w => w.entry.id === winner.id)
  pendingWinner = winner
  result.value = null
  drawn.value = true
  spinning.value = true
  await nextTick()
  wheel.value?.spin(idx)
}

function onWheelDone() {
  result.value = pendingWinner
  spinning.value = false
}

onMounted(async () => {
  await fetchCategories()
  selectedCategories.value = categories.value.map(c => c.name)
  if (!entries.value.length) await fetchEntries()
})
</script>
