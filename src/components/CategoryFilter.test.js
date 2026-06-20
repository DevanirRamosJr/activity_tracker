import { describe, it, expect, vi } from 'vitest'

vi.mock('../composables/useI18n', async () => {
  const ptBR = (await import('../locales/pt-BR')).default
  function t(key) {
    return key.split('.').reduce((o, k) => o?.[k], ptBR) ?? key
  }
  return { useI18n: () => ({ t, locale: { value: 'pt-BR' }, setLocale: vi.fn(), dateLocale: () => 'pt-BR' }) }
})
import { mount } from '@vue/test-utils'
import CategoryFilter from './CategoryFilter.vue'

const categories = [
  { id: '1', name: 'Movie', color_bg: 'bg-blue-100', color_text: 'text-blue-700' },
  { id: '2', name: 'Anime', color_bg: 'bg-pink-100', color_text: 'text-pink-700' },
  { id: '3', name: 'Game', color_bg: 'bg-green-100', color_text: 'text-green-700' },
]

function factory(modelValue) {
  return mount(CategoryFilter, {
    props: {
      modelValue,
      categories,
      counts: { Movie: 1, Anime: 2, Game: 0 },
      totalCount: 3,
    },
  })
}

// Buttons are [All, Movie, Anime, Game]
function categoryButton(wrapper, name) {
  return wrapper.findAll('button').find(b => b.text().startsWith(name))
}

describe('CategoryFilter', () => {
  it('renders an All button plus one button per category', () => {
    const wrapper = factory(['Movie', 'Anime', 'Game'])
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(4)
    expect(buttons[0].text()).toContain('Todos')
  })

  it('shows counts only for categories with entries', () => {
    const wrapper = factory(['Movie', 'Anime', 'Game'])
    expect(categoryButton(wrapper, 'Movie').text()).toContain('1')
    expect(categoryButton(wrapper, 'Game').text()).toBe('Game')
  })

  it('applies the category color when selected', () => {
    const wrapper = factory(['Anime'])
    expect(categoryButton(wrapper, 'Anime').classes()).toContain('bg-pink-100')
  })

  it('adds a category when an unselected one is clicked', async () => {
    const wrapper = factory(['Movie'])
    await categoryButton(wrapper, 'Anime').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['Movie', 'Anime'])
  })

  it('removes a category when a selected one is clicked', async () => {
    const wrapper = factory(['Movie', 'Anime'])
    await categoryButton(wrapper, 'Anime').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['Movie'])
  })

  it('re-selects all when the last selected category is removed', async () => {
    const wrapper = factory(['Anime'])
    await categoryButton(wrapper, 'Anime').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['Movie', 'Anime', 'Game'])
  })

  it('selects every category when All is clicked', async () => {
    const wrapper = factory(['Movie'])
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['Movie', 'Anime', 'Game'])
  })

  it('highlights All only when every category is selected', () => {
    const all = factory(['Movie', 'Anime', 'Game']).findAll('button')[0]
    expect(all.classes()).toContain('bg-gray-900')

    const partial = factory(['Movie']).findAll('button')[0]
    expect(partial.classes()).not.toContain('bg-gray-900')
  })
})
