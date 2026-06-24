import { describe, it, expect } from 'vitest'
import { computeWeights, drawEntry } from './draw'

function makeEntry(overrides = {}) {
  return {
    id: 'e1',
    status: 'Want to',
    category: { name: 'Movie' },
    created_at: '2026-01-01T00:00:00Z',
    scores: [],
    ...overrides,
  }
}

const ALL_STATUSES = ['Want to', 'In Progress', 'Done']
const ALL_CATS = ['Movie', 'Cartoon', 'Series', 'Anime', 'Game']

function baseOptions(overrides = {}) {
  return { statuses: ALL_STATUSES, categories: ALL_CATS, desire: {}, date: {}, ...overrides }
}

function scores(...desires) {
  return desires.map((d, i) => ({ user_id: `u${i}`, desire_level: d }))
}

describe('computeWeights', () => {
  it('keeps only entries matching the selected statuses', () => {
    const entries = [
      makeEntry({ id: 'a', status: 'Want to' }),
      makeEntry({ id: 'b', status: 'Done' }),
    ]
    const result = computeWeights(entries, baseOptions({ statuses: ['Done'] }))
    expect(result.map(w => w.entry.id)).toEqual(['b'])
  })

  it('keeps only entries matching the selected categories', () => {
    const entries = [
      makeEntry({ id: 'a', category: { name: 'Movie' } }),
      makeEntry({ id: 'b', category: { name: 'Game' } }),
    ]
    const result = computeWeights(entries, baseOptions({ categories: ['Game'] }))
    expect(result.map(w => w.entry.id)).toEqual(['b'])
  })

  it('returns empty when nothing matches', () => {
    const entries = [makeEntry({ status: 'Want to' })]
    expect(computeWeights(entries, baseOptions({ statuses: [] }))).toEqual([])
  })

  it('gives every entry weight 1 when no weighting is enabled', () => {
    const entries = [makeEntry({ id: 'a', scores: scores(9) }), makeEntry({ id: 'b', scores: scores(2) })]
    const result = computeWeights(entries, baseOptions())
    expect(result.every(w => w.weight === 1)).toBe(true)
  })

  it('weights by average desire when enabled', () => {
    const entries = [
      makeEntry({ id: 'high', scores: scores(8, 10) }), // avg 9
      makeEntry({ id: 'low', scores: scores(3, 5) }), // avg 4
    ]
    const result = computeWeights(entries, baseOptions({ desire: { enabled: true } }))
    expect(result.find(w => w.entry.id === 'high').weight).toBe(9)
    expect(result.find(w => w.entry.id === 'low').weight).toBe(4)
  })

  it('inverts desire weighting', () => {
    const entries = [
      makeEntry({ id: 'high', scores: scores(9) }),
      makeEntry({ id: 'low', scores: scores(4) }),
    ]
    const result = computeWeights(entries, baseOptions({ desire: { enabled: true, invert: true } }))
    expect(result.find(w => w.entry.id === 'high').weight).toBe(2) // 11 - 9
    expect(result.find(w => w.entry.id === 'low').weight).toBe(7) // 11 - 4
  })

  it('uses a neutral desire for entries with no scores', () => {
    const entries = [makeEntry({ id: 'a', scores: [] })]
    const result = computeWeights(entries, baseOptions({ desire: { enabled: true } }))
    expect(result[0].weight).toBe(5)
  })

  it('favors older entries by date, and newer when inverted', () => {
    const entries = [
      makeEntry({ id: 'old', created_at: '2020-01-01T00:00:00Z' }),
      makeEntry({ id: 'new', created_at: '2026-01-01T00:00:00Z' }),
    ]
    const normal = computeWeights(entries, baseOptions({ date: { enabled: true } }))
    expect(normal.find(w => w.entry.id === 'old').weight).toBeGreaterThan(
      normal.find(w => w.entry.id === 'new').weight
    )

    const inverted = computeWeights(entries, baseOptions({ date: { enabled: true, invert: true } }))
    expect(inverted.find(w => w.entry.id === 'new').weight).toBeGreaterThan(
      inverted.find(w => w.entry.id === 'old').weight
    )
  })

  it('multiplies desire and date factors when both are enabled', () => {
    const entries = [makeEntry({ id: 'a', scores: scores(6), created_at: '2026-01-01T00:00:00Z' })]
    const result = computeWeights(
      entries,
      baseOptions({ desire: { enabled: true }, date: { enabled: true } })
    )
    // single entry → date position 0.5 → factor 1 + 0.5*9 = 5.5; desire 6 → 6*5.5
    expect(result[0].weight).toBeCloseTo(6 * 5.5)
  })
})

describe('drawEntry', () => {
  it('returns null when nothing is eligible', () => {
    expect(drawEntry([], baseOptions())).toBeNull()
  })

  it('picks deterministically given a seeded rng', () => {
    const entries = [
      makeEntry({ id: 'a', scores: scores(1) }),
      makeEntry({ id: 'b', scores: scores(9) }),
    ]
    const options = baseOptions({ desire: { enabled: true } })
    // weights: a=1, b=9, total=10. rng=0.05 → 0.5 into "a" bucket (0..1).
    expect(drawEntry(entries, options, () => 0.05).id).toBe('a')
    // rng=0.5 → 5.0, past a's bucket → falls in b.
    expect(drawEntry(entries, options, () => 0.5).id).toBe('b')
  })

  it('can pick any eligible entry with equal weights', () => {
    const entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })]
    expect(drawEntry(entries, baseOptions(), () => 0).id).toBe('a')
    expect(drawEntry(entries, baseOptions(), () => 0.99).id).toBe('b')
  })
})
