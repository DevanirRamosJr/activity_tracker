import { getAvgScore } from './entryUtils'

// How strong the date weighting is: factor ranges from 1 (least likely)
// to 1 + SCALE (most likely), matching the 1..10 range desire uses.
const SCALE = 9
const NEUTRAL_DESIRE = 5

// Returns [{ entry, weight }] for the entries that pass the status/category
// filters, with a weight derived from the enabled desire/date options.
export function computeWeights(entries, options = {}) {
  const { statuses = [], categories = [], desire = {}, date = {} } = options

  const eligible = entries.filter(
    e => statuses.includes(e.status) && categories.includes(e.category?.name)
  )
  if (!eligible.length) return []

  let minT = Infinity
  let maxT = -Infinity
  if (date.enabled) {
    for (const e of eligible) {
      const t = new Date(e.created_at).getTime()
      if (t < minT) minT = t
      if (t > maxT) maxT = t
    }
  }

  return eligible.map(e => {
    let weight = 1

    if (desire.enabled) {
      const avg = getAvgScore(e, 'desire_level') || NEUTRAL_DESIRE
      weight *= desire.invert ? 11 - avg : avg
    }

    if (date.enabled) {
      // position: 0 = oldest, 1 = newest
      const position =
        maxT === minT ? 0.5 : (new Date(e.created_at).getTime() - minT) / (maxT - minT)
      // Normally older entries are favored; invert flips it to newer.
      weight *= date.invert ? 1 + position * SCALE : 1 + (1 - position) * SCALE
    }

    return { entry: e, weight }
  })
}

// Picks a single entry using the computed weights. `rng` is injectable for tests.
export function drawEntry(entries, options = {}, rng = Math.random) {
  const weighted = computeWeights(entries, options)
  if (!weighted.length) return null

  const total = weighted.reduce((sum, w) => sum + w.weight, 0)
  if (total <= 0) {
    return weighted[Math.floor(rng() * weighted.length)].entry
  }

  let r = rng() * total
  for (const w of weighted) {
    r -= w.weight
    if (r < 0) return w.entry
  }
  return weighted[weighted.length - 1].entry
}
