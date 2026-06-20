export const STATUSES = ['Want to', 'In Progress', 'Done']

export const STATUS_COLORS = {
  'Want to': 'bg-gray-100 text-gray-500',
  'In Progress': 'bg-orange-100 text-orange-600',
  Done: 'bg-emerald-100 text-emerald-700',
}

export function formatDate(d, locale = 'pt-BR') {
  return new Date(d).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
