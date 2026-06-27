import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock useAuth so the card sees a known current user.
vi.mock('../composables/useAuth', async () => {
  const { ref } = await import('vue')
  return { useAuth: () => ({ currentUser: ref({ id: 'user-a', username: 'admin' }) }) }
})

vi.mock('../composables/useI18n', async () => {
  const ptBR = (await import('../locales/pt-BR')).default
  function t(key) { return key.split('.').reduce((o, k) => o?.[k], ptBR) ?? key }
  return { useI18n: () => ({ t, tStatus: (v) => v, tCategory: (v) => v, locale: { value: 'pt-BR' }, setLocale: vi.fn(), dateLocale: () => 'pt-BR' }) }
})

// The ImagePicker child pulls in network/storage modules; stub them out here.
vi.mock('../lib/imageSearch', () => ({ searchImages: vi.fn(), isConfigured: () => true }))
vi.mock('../lib/storage', () => ({ uploadImage: vi.fn() }))

import EntryCard from './EntryCard.vue'

const category = {
  id: 'c1', name: 'Movie', color_bg: 'bg-blue-100', color_text: 'text-blue-700',
}

function makeEntry(overrides = {}) {
  return {
    id: 'e1',
    user_id: 'user-a',
    title: 'Inception',
    category,
    status: 'Done',
    notes: 'great film',
    created_at: '2026-01-01T00:00:00Z',
    history: [{ created_at: '2026-01-01T00:00:00Z', description: 'Entry added', user: { username: 'admin' } }],
    scores: [{ user_id: 'user-a', desire_level: 7, rating: 9 }],
    ...overrides,
  }
}

function factory(entry = makeEntry()) {
  return mount(EntryCard, { props: { entry, categories: [category] } })
}

function buttonByText(wrapper, text) {
  return wrapper.findAll('button').find(b => b.text() === text)
}

describe('EntryCard', () => {
  it('renders the title, category, status and notes', () => {
    const text = factory().text()
    expect(text).toContain('Inception')
    expect(text).toContain('Movie')
    expect(text).toContain('Done')
    expect(text).toContain('great film')
  })

  it("shows the current user's desire and rating badges", () => {
    const text = factory().text()
    expect(text).toContain('Vontade 7/10')
    expect(text).toContain('Nota 9/10')
  })

  it("shows other users' scores with their username", () => {
    const entry = makeEntry({
      scores: [
        { id: 's1', user_id: 'user-a', desire_level: 7, rating: 9 },
        { id: 's2', user_id: 'user-b', desire_level: 4, rating: 6, user: { username: 'bob' } },
      ],
    })
    const text = factory(entry).text()
    expect(text).toContain('bob')
    expect(text).toContain('Vontade 4/10')
    expect(text).toContain('Nota 6/10')
  })

  it('renders the poster when image_url is set', () => {
    const wrapper = factory(makeEntry({ image_url: 'https://img/poster.jpg' }))
    expect(wrapper.find('img').attributes('src')).toBe('https://img/poster.jpg')
  })

  it('omits the rating badge when the user has no rating', () => {
    const entry = makeEntry({ scores: [{ user_id: 'user-a', desire_level: 5, rating: null }] })
    const text = factory(entry).text()
    expect(text).toContain('Vontade 5/10')
    expect(text).not.toContain('Nota')
  })

  it('confirms before emitting delete', async () => {
    const wrapper = factory()
    await buttonByText(wrapper, 'Excluir').trigger('click')

    // No delete yet — a confirmation dialog appears first.
    expect(wrapper.emitted('delete')).toBeFalsy()
    expect(wrapper.text()).toContain('Excluir este item?')

    // Confirm via the dialog's button (the last "Excluir").
    const deleteButtons = wrapper.findAll('button').filter(b => b.text() === 'Excluir')
    await deleteButtons[deleteButtons.length - 1].trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('hides the delete button for entries created by another user', () => {
    const wrapper = factory(makeEntry({ user_id: 'user-b' }))
    expect(wrapper.findAll('button').some(b => b.text() === 'Excluir')).toBe(false)
    // Edit is still available to everyone.
    expect(wrapper.findAll('button').some(b => b.text() === 'Editar')).toBe(true)
  })

  it('does not delete when the confirmation is cancelled', async () => {
    const wrapper = factory()
    await buttonByText(wrapper, 'Excluir').trigger('click')
    await buttonByText(wrapper, 'Cancelar').trigger('click')
    expect(wrapper.emitted('delete')).toBeFalsy()
    expect(wrapper.text()).not.toContain('Excluir este item?')
  })

  it('enters edit mode pre-filled and emits update on save', async () => {
    const wrapper = factory()
    await buttonByText(wrapper, 'Editar').trigger('click')

    expect(wrapper.find('input[placeholder="Título"]').element.value).toBe('Inception')

    await buttonByText(wrapper, 'Salvar').trigger('click')
    const payload = wrapper.emitted('update')[0][0]
    expect(payload).toMatchObject({
      title: 'Inception',
      category_id: 'c1',
      status: 'Done',
      desire_level: 7,
      rating: 9,
    })
  })

  it('toggles the history list', async () => {
    const wrapper = factory()
    expect(wrapper.find('ul').exists()).toBe(false)

    const historyToggle = wrapper.findAll('button').find(b => b.text().includes('Histórico'))
    await historyToggle.trigger('click')

    expect(wrapper.find('ul').exists()).toBe(true)
    expect(wrapper.find('ul').text()).toContain('Entry added')
    expect(wrapper.find('ul').text()).toContain('admin')
  })
})
