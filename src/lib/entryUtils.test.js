import { describe, it, expect } from 'vitest'
import {
  SORT_OPTIONS,
  STATUS_ORDER,
  getMyScore,
  getAvgScore,
  getLastUpdate,
  filterEntries,
  sortEntries,
} from './entryUtils'

const USER_A = 'user-a'
const USER_B = 'user-b'

function makeEntry(overrides = {}) {
  return {
    id: 'e1',
    title: 'Untitled',
    status: 'Want to',
    category: { name: 'Movie' },
    created_at: '2026-01-01T00:00:00Z',
    history: [],
    scores: [],
    ...overrides,
  }
}

describe('getMyScore', () => {
  it('returns the score for the matching user', () => {
    const entry = makeEntry({
      scores: [
        { user_id: USER_A, desire_level: 7, rating: 9 },
        { user_id: USER_B, desire_level: 3, rating: 5 },
      ],
    })
    expect(getMyScore(entry, 'desire_level', USER_A)).toBe(7)
    expect(getMyScore(entry, 'rating', USER_B)).toBe(5)
  })

  it('returns 0 when the user has no score', () => {
    const entry = makeEntry({ scores: [{ user_id: USER_B, desire_level: 4 }] })
    expect(getMyScore(entry, 'desire_level', USER_A)).toBe(0)
  })

  it('returns 0 when scores are missing', () => {
    const entry = makeEntry({ scores: undefined })
    expect(getMyScore(entry, 'rating', USER_A)).toBe(0)
  })
})

describe('getAvgScore', () => {
  it('averages a field across all users', () => {
    const entry = makeEntry({
      scores: [
        { user_id: USER_A, desire_level: 8 },
        { user_id: USER_B, desire_level: 4 },
      ],
    })
    expect(getAvgScore(entry, 'desire_level')).toBe(6)
  })

  it('ignores null values when averaging', () => {
    const entry = makeEntry({
      scores: [
        { user_id: USER_A, rating: 10 },
        { user_id: USER_B, rating: null },
      ],
    })
    expect(getAvgScore(entry, 'rating')).toBe(10)
  })

  it('returns 0 when there are no scores', () => {
    expect(getAvgScore(makeEntry({ scores: [] }), 'desire_level')).toBe(0)
  })
})

describe('getLastUpdate', () => {
  it('returns the last history event date', () => {
    const entry = makeEntry({
      created_at: '2026-01-01T00:00:00Z',
      history: [
        { created_at: '2026-01-02T00:00:00Z' },
        { created_at: '2026-01-05T00:00:00Z' },
      ],
    })
    expect(getLastUpdate(entry)).toBe('2026-01-05T00:00:00Z')
  })

  it('falls back to created_at when history is empty', () => {
    const entry = makeEntry({ created_at: '2026-01-01T00:00:00Z', history: [] })
    expect(getLastUpdate(entry)).toBe('2026-01-01T00:00:00Z')
  })
})

describe('filterEntries', () => {
  const entries = [
    makeEntry({ id: '1', title: 'Inception', category: { name: 'Movie' } }),
    makeEntry({ id: '2', title: 'Naruto', category: { name: 'Anime' } }),
    makeEntry({ id: '3', title: 'Tom and Jerry', category: { name: 'Cartoon' } }),
  ]

  it('returns all entries when no categories are selected', () => {
    expect(filterEntries(entries, [], '')).toHaveLength(3)
  })

  it('filters by selected categories', () => {
    const result = filterEntries(entries, ['Anime', 'Cartoon'], '')
    expect(result.map(e => e.id)).toEqual(['2', '3'])
  })

  it('filters by case-insensitive search term', () => {
    const result = filterEntries(entries, [], 'NAR')
    expect(result.map(e => e.id)).toEqual(['2'])
  })

  it('combines category and search filters', () => {
    const result = filterEntries(entries, ['Movie'], 'inception')
    expect(result.map(e => e.id)).toEqual(['1'])
  })

  it('ignores whitespace-only search', () => {
    expect(filterEntries(entries, [], '   ')).toHaveLength(3)
  })
})

describe('sortEntries', () => {
  const a = makeEntry({
    id: 'a', title: 'Avatar', status: 'Done',
    created_at: '2026-01-01T00:00:00Z',
    history: [{ created_at: '2026-01-10T00:00:00Z' }],
    scores: [
      { user_id: USER_A, desire_level: 2, rating: 9 },
      { user_id: USER_B, desire_level: 4, rating: 7 },
    ],
  })
  const b = makeEntry({
    id: 'b', title: 'Zelda', status: 'Want to',
    created_at: '2026-03-01T00:00:00Z',
    history: [{ created_at: '2026-03-02T00:00:00Z' }],
    scores: [
      { user_id: USER_A, desire_level: 9, rating: 3 },
      { user_id: USER_B, desire_level: 10, rating: 1 },
    ],
  })
  const list = [a, b]

  it('does not mutate the input array', () => {
    const copy = [...list]
    sortEntries(list, 'a-z', USER_A)
    expect(list).toEqual(copy)
  })

  it('sorts newest first', () => {
    expect(sortEntries(list, 'newest', USER_A).map(e => e.id)).toEqual(['b', 'a'])
  })

  it('sorts oldest first', () => {
    expect(sortEntries(list, 'oldest', USER_A).map(e => e.id)).toEqual(['a', 'b'])
  })

  it('sorts alphabetically A→Z and Z→A', () => {
    expect(sortEntries(list, 'a-z', USER_A).map(e => e.id)).toEqual(['a', 'b'])
    expect(sortEntries(list, 'z-a', USER_A).map(e => e.id)).toEqual(['b', 'a'])
  })

  it('sorts by most recently updated', () => {
    expect(sortEntries(list, 'updated', USER_A).map(e => e.id)).toEqual(['b', 'a'])
  })

  it('sorts by status order (Want to → In Progress → Done)', () => {
    expect(sortEntries(list, 'status', USER_A).map(e => e.id)).toEqual(['b', 'a'])
  })

  it('sorts by my desire (highest first)', () => {
    expect(sortEntries(list, 'my-desire', USER_A).map(e => e.id)).toEqual(['b', 'a'])
  })

  it('sorts by average desire (highest first)', () => {
    expect(sortEntries(list, 'avg-desire', USER_A).map(e => e.id)).toEqual(['b', 'a'])
  })

  it('sorts by my rating (highest first) and respects the user', () => {
    expect(sortEntries(list, 'my-rating', USER_A).map(e => e.id)).toEqual(['a', 'b'])
    expect(sortEntries(list, 'my-rating', USER_B).map(e => e.id)).toEqual(['a', 'b'])
  })

  it('sorts by average rating (highest first)', () => {
    expect(sortEntries(list, 'avg-rating', USER_A).map(e => e.id)).toEqual(['a', 'b'])
  })
})

describe('config constants', () => {
  it('exposes 10 sort options each with value and label', () => {
    expect(SORT_OPTIONS).toHaveLength(10)
    for (const opt of SORT_OPTIONS) {
      expect(opt).toHaveProperty('value')
      expect(opt).toHaveProperty('label')
    }
  })

  it('orders statuses correctly', () => {
    expect(STATUS_ORDER['Want to']).toBeLessThan(STATUS_ORDER['In Progress'])
    expect(STATUS_ORDER['In Progress']).toBeLessThan(STATUS_ORDER.Done)
  })
})
