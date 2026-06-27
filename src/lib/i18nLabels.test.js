import { describe, it, expect } from 'vitest'
import { translateStatus, translateCategory } from './i18nLabels'

const messages = {
  status: { 'Want to': 'Quero ver', Done: 'Concluído' },
  categories: { Movie: 'Filme', Game: 'Jogo' },
}

describe('translateStatus', () => {
  it('translates a known status', () => {
    expect(translateStatus(messages, 'Done')).toBe('Concluído')
  })

  it('falls back to the raw value for an unknown status', () => {
    expect(translateStatus(messages, 'Paused')).toBe('Paused')
  })

  it('falls back when messages or block are missing', () => {
    expect(translateStatus(undefined, 'Done')).toBe('Done')
    expect(translateStatus({}, 'Done')).toBe('Done')
  })
})

describe('translateCategory', () => {
  it('translates a known category', () => {
    expect(translateCategory(messages, 'Movie')).toBe('Filme')
  })

  it('falls back to the raw name for a user-added category', () => {
    expect(translateCategory(messages, 'Documentary')).toBe('Documentary')
  })

  it('falls back when messages or block are missing', () => {
    expect(translateCategory(undefined, 'Movie')).toBe('Movie')
    expect(translateCategory({}, 'Movie')).toBe('Movie')
  })
})
