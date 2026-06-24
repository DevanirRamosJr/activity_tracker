// Free, browser-friendly image search from several sources, merged together.
// Order of preference: TMDB (best posters) → Wikipedia → Fandom → Commons.
// TMDB needs VITE_TMDB_KEY; the other three need no key.

const WIKI = 'https://en.wikipedia.org/w/api.php'
const COMMONS = 'https://commons.wikimedia.org/w/api.php'
const TMDB = 'https://api.themoviedb.org/3/search/multi'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i
const SOURCE_COUNT = 4
const DEFAULT_PER_SOURCE = 4

export function isConfigured() {
  return true
}

// Max images taken from each source — configurable via VITE_IMAGES_PER_SOURCE.
function perSource() {
  const n = parseInt(import.meta.env.VITE_IMAGES_PER_SOURCE, 10)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_PER_SOURCE
}

// Resilient fetch — returns parsed JSON, or null on any failure.
async function fetchJson(url, options) {
  try {
    const res = await fetch(url, options)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// TMDB multi-search (movies, series, anime). Skipped when no key is set.
// Supports both a v3 API key (query param) and a v4 read token (Bearer header).
async function tmdbImages(term) {
  const key = import.meta.env.VITE_TMDB_KEY
  if (!key) return []
  const isV4Token = key.startsWith('eyJ')
  const params = new URLSearchParams({ query: term, include_adult: 'false' })
  if (!isV4Token) params.set('api_key', key)
  const options = isV4Token ? { headers: { Authorization: `Bearer ${key}` } } : undefined
  const data = await fetchJson(`${TMDB}?${params.toString()}`, options)
  if (!data?.results) return []
  return data.results
    .filter(r => r.poster_path)
    .map(r => ({
      url: `${TMDB_IMG}${r.poster_path}`,
      thumbnail: `${TMDB_IMG}${r.poster_path}`,
      title: r.title || r.name || '',
    }))
}

// Lead image of each matching Wikipedia article.
async function wikipediaImages(term) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: term,
    gsrlimit: '10',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '400',
    format: 'json',
    origin: '*',
  })
  const data = await fetchJson(`${WIKI}?${params.toString()}`)
  const pages = data?.query?.pages
  if (!pages) return []
  return Object.values(pages)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .filter(p => p.thumbnail?.source)
    .map(p => ({ url: p.thumbnail.source, thumbnail: p.thumbnail.source, title: p.title || '' }))
}

// Cross-wiki Fandom search via CORS proxy (Cloudflare Worker).
async function fandomImages(term) {
  const proxy = import.meta.env.VITE_FANDOM_PROXY_URL
  if (!proxy) return []
  const params = new URLSearchParams({ query: term, lang: 'en', namespace: '0', limit: '8' })
  const data = await fetchJson(`${proxy}?${params.toString()}`)
  if (!data?.results) return []
  return data.results
    .filter(r => r.thumbnail)
    .map(r => {
      const img = r.thumbnail.replace(/\/revision\/latest.*$/, '/revision/latest/scale-to-width-down/400')
      return { url: img, thumbnail: img, title: r.title || '' }
    })
}

// Media files from Wikimedia Commons.
async function commonsImages(term) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: term,
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
  })
  const data = await fetchJson(`${COMMONS}?${params.toString()}`)
  const pages = data?.query?.pages
  if (!pages) return []
  return Object.values(pages)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .filter(p => IMAGE_EXT.test(p.title || '') && p.imageinfo?.[0]?.thumburl)
    .map(p => ({
      url: p.imageinfo[0].thumburl,
      thumbnail: p.imageinfo[0].thumburl,
      title: (p.title || '').replace(/^File:/, ''),
    }))
}

export async function searchImages(query, count) {
  const term = (query || '').trim()
  if (!term) return []

  const cap = perSource()
  const limit = count ?? cap * SOURCE_COUNT

  const sources = await Promise.all([
    tmdbImages(term),
    wikipediaImages(term),
    fandomImages(term),
    commonsImages(term),
  ])

  // Take up to `cap` from each source (for variety), dedupe by url, cap total at `limit`.
  const seen = new Set()
  const results = []
  for (const list of sources) {
    let taken = 0
    for (const item of list) {
      if (taken >= cap || results.length >= limit) break
      if (!item.url || seen.has(item.url)) continue
      seen.add(item.url)
      results.push(item)
      taken++
    }
    if (results.length >= limit) break
  }
  return results
}
