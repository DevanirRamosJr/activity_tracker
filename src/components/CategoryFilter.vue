<template>
  <div class="flex gap-2 flex-wrap mb-6">
    <button
      @click="toggleAll"
      :class="[
        'px-3 py-1 rounded-full text-sm font-medium transition-colors border',
        allSelected
          ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:border-gray-500',
      ]"
    >
      {{ t('list.all') }}
      <span
        v-if="totalCount > 0"
        :class="['ml-1.5 text-xs', allSelected ? 'text-gray-300' : 'text-gray-400']"
      >
        {{ totalCount }}
      </span>
    </button>
    <button
      v-for="cat in categories"
      :key="cat.id"
      @click="toggle(cat.name)"
      :class="[
        'px-3 py-1 rounded-full text-sm font-medium transition-colors border',
        modelValue.includes(cat.name)
          ? [cat.color_bg, cat.color_text, 'border-current']
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:border-gray-500',
      ]"
    >
      {{ tCategory(cat.name) }}
      <span
        v-if="counts[cat.name] > 0"
        class="ml-1.5 text-xs opacity-60"
      >
        {{ counts[cat.name] }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t, tCategory } = useI18n()

const props = defineProps({
  modelValue: { type: Array, required: true },
  categories: { type: Array, required: true },
  counts: { type: Object, required: true },
  totalCount: { type: Number, required: true },
})
const emit = defineEmits(['update:modelValue'])

const allNames = computed(() => props.categories.map(c => c.name))
const allSelected = computed(() => props.modelValue.length === allNames.value.length)

function toggleAll() {
  emit('update:modelValue', [...allNames.value])
}

function toggle(name) {
  const current = props.modelValue
  if (current.includes(name)) {
    const next = current.filter(n => n !== name)
    emit('update:modelValue', next.length ? next : [...allNames.value])
  } else {
    emit('update:modelValue', [...current, name])
  }
}
</script>
