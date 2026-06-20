export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'a-z', label: 'A → Z' },
  { value: 'z-a', label: 'Z → A' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'status', label: 'Status' },
  { value: 'my-desire', label: 'My desire' },
  { value: 'avg-desire', label: 'Avg desire' },
  { value: 'my-rating', label: 'My rating' },
  { value: 'avg-rating', label: 'Avg rating' },
]

export const STATUS_ORDER = { 'Want to': 0, 'In Progress': 1, Done: 2 }

export function getMyScore(entry, field, userId) {
  const s = entry.scores?.find(s => s.user_id === userId)
  return s?.[field] || 0
}

export function getAvgScore(entry, field) {
  const scores = entry.scores?.filter(s => s[field] != null) || []
  if (!scores.length) return 0
  return scores.reduce((sum, s) => sum + s[field], 0) / scores.length
}

export function getLastUpdate(entry) {
  const h = entry.history
  if (!h?.length) return entry.created_at
  return h[h.length - 1].created_at
}

export function filterEntries(entries, selectedCategories, search) {
  const term = search.trim().toLowerCase()
  return entries
    .filter(e => !selectedCategories.length || selectedCategories.includes(e.category?.name))
    .filter(e => !term || e.title.toLowerCase().includes(term))
}

export function sortEntries(entries, sortBy, userId) {
  return [...entries].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'a-z':
        return a.title.localeCompare(b.title)
      case 'z-a':
        return b.title.localeCompare(a.title)
      case 'updated':
        return new Date(getLastUpdate(b)) - new Date(getLastUpdate(a))
      case 'status':
        return (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
      case 'my-desire':
        return getMyScore(b, 'desire_level', userId) - getMyScore(a, 'desire_level', userId)
      case 'avg-desire':
        return getAvgScore(b, 'desire_level') - getAvgScore(a, 'desire_level')
      case 'my-rating':
        return getMyScore(b, 'rating', userId) - getMyScore(a, 'rating', userId)
      case 'avg-rating':
        return getAvgScore(b, 'rating') - getAvgScore(a, 'rating')
      default:
        return 0
    }
  })
}
