import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchImages, isConfigured } from './imageSearch'

function ok(body) {
  return { ok: true, json: async () => body }
}

// Route fetch to a fake response per source, based on the URL.
function routeFetch({ wiki, commons, fandom, tmdb } = {}) {
  return vi.fn(input => {
    const url = String(input)
    if (url.includes('api.themoviedb.org')) return Promise.resolve(ok(tmdb ?? { results: [] }))
    if (url.includes('fandom-proxy')) return Promise.resolve(ok(fandom ?? { results: [] }))
    if (url.includes('commons.wikimedia.org')) return Promise.resolve(ok(commons ?? { query: { pages: {} } }))
    return Promise.resolve(ok(wiki ?? { query: { pages: {} } }))
  })
}

const wikiPages = (...sources) => ({
  query: {
    pages: Object.fromEntries(
      sources.map((src, i) => [i, { index: i, title: `W${i}`, thumbnail: { source: src } }])
    ),
  },
})

const commonsPages = (...sources) => ({
  query: {
    pages: Object.fromEntries(
      sources.map((src, i) => [i, { index: i, title: `File:c${i}.jpg`, imageinfo: [{ thumburl: src }] }])
    ),
  },
})

describe('imageSearch (multi-source)', () => {
  beforeEach(() => {
    // Ensure the Fandom proxy is "configured" regardless of the local env.
    vi.stubEnv('VITE_FANDOM_PROXY_URL', 'https://fandom-proxy.test')
    global.fetch = routeFetch()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('needs no configuration', () => {
    expect(isConfigured()).toBe(true)
  })

  it('returns [] for a blank query without calling fetch', async () => {
    expect(await searchImages('   ')).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('queries Wikipedia, Commons and Fandom (TMDB skipped without a key)', async () => {
    vi.stubEnv('VITE_TMDB_KEY', '')
    await searchImages('zelda')
    const urls = fetch.mock.calls.map(c => String(c[0]))
    expect(urls.some(u => u.includes('en.wikipedia.org'))).toBe(true)
    expect(urls.some(u => u.includes('commons.wikimedia.org'))).toBe(true)
    expect(urls.some(u => u.includes('fandom-proxy') && u.includes('namespace=0'))).toBe(true)
    expect(urls.some(u => u.includes('api.themoviedb.org'))).toBe(false)
  })

  it('includes TMDB first when a key is configured', async () => {
    vi.stubEnv('VITE_TMDB_KEY', 'tmdb-key')
    global.fetch = routeFetch({
      tmdb: { results: [{ poster_path: '/poster.jpg', title: 'Movie' }] },
      wiki: wikiPages('https://w/0.jpg'),
    })

    const results = await searchImages('movie')
    expect(results[0]).toEqual({
      url: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      thumbnail: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      title: 'Movie',
    })
  })

  it('caps each source at the per-source limit', async () => {
    vi.stubEnv('VITE_IMAGES_PER_SOURCE', '3')
    global.fetch = routeFetch({
      wiki: wikiPages('https://w/0.jpg', 'https://w/1.jpg', 'https://w/2.jpg', 'https://w/3.jpg', 'https://w/4.jpg'),
    })

    const results = await searchImages('x')
    const wikiCount = results.filter(r => r.url.startsWith('https://w/')).length
    expect(wikiCount).toBe(3)
  })

  it('honors VITE_IMAGES_PER_SOURCE for the per-source cap', async () => {
    vi.stubEnv('VITE_IMAGES_PER_SOURCE', '2')
    global.fetch = routeFetch({
      wiki: wikiPages('https://w/0.jpg', 'https://w/1.jpg', 'https://w/2.jpg', 'https://w/3.jpg'),
    })
    const results = await searchImages('x')
    expect(results.filter(r => r.url.startsWith('https://w/'))).toHaveLength(2)
  })

  it('authenticates TMDB v4 tokens with a Bearer header (no api_key param)', async () => {
    vi.stubEnv('VITE_TMDB_KEY', 'eyJabc.def.ghi')
    global.fetch = routeFetch({ tmdb: { results: [{ poster_path: '/p.jpg', title: 'M' }] } })

    await searchImages('movie')
    const tmdbCall = fetch.mock.calls.find(c => String(c[0]).includes('api.themoviedb.org'))
    expect(tmdbCall[0]).not.toContain('api_key=')
    expect(tmdbCall[1]?.headers?.Authorization).toBe('Bearer eyJabc.def.ghi')
  })

  it('authenticates a v3 key with the api_key query param', async () => {
    vi.stubEnv('VITE_TMDB_KEY', 'plain-v3-key')
    global.fetch = routeFetch({ tmdb: { results: [] } })

    await searchImages('movie')
    const tmdbCall = fetch.mock.calls.find(c => String(c[0]).includes('api.themoviedb.org'))
    expect(tmdbCall[0]).toContain('api_key=plain-v3-key')
    expect(tmdbCall[1]).toBeUndefined()
  })

  it('upgrades Fandom thumbnails to a usable width', async () => {
    global.fetch = routeFetch({
      fandom: {
        results: [
          { title: 'Master Sword', thumbnail: 'https://static.wikia.nocookie.net/zelda/images/a/b/Sword.png/revision/latest/sm' },
        ],
      },
    })
    const results = await searchImages('zelda')
    const fandomResult = results.find(r => r.url.includes('wikia.nocookie.net'))
    expect(fandomResult).toBeTruthy()
    expect(fandomResult.url).toBe(
      'https://static.wikia.nocookie.net/zelda/images/a/b/Sword.png/revision/latest/scale-to-width-down/400'
    )
  })

  it('dedupes the same url appearing in multiple sources', async () => {
    global.fetch = routeFetch({
      wiki: wikiPages('https://shared.jpg'),
      commons: commonsPages('https://shared.jpg'),
    })
    const results = await searchImages('x')
    expect(results.filter(r => r.url === 'https://shared.jpg')).toHaveLength(1)
  })

  it('filters out non-image Commons files', async () => {
    global.fetch = routeFetch({
      commons: {
        query: {
          pages: {
            '1': { index: 1, title: 'File:Doc.pdf', imageinfo: [{ thumburl: 'https://c/doc.pdf' }] },
            '2': { index: 2, title: 'File:Cover.png', imageinfo: [{ thumburl: 'https://c/cover.png' }] },
          },
        },
      },
    })
    const results = await searchImages('x')
    expect(results.map(r => r.url)).toEqual(['https://c/cover.png'])
  })

  it('still returns other sources when one fails', async () => {
    global.fetch = vi.fn(input => {
      const url = String(input)
      if (url.includes('commons.wikimedia.org')) return Promise.reject(new Error('network'))
      if (url.includes('en.wikipedia.org')) return Promise.resolve(ok(wikiPages('https://w/0.jpg')))
      return Promise.resolve(ok({ results: [] }))
    })
    const results = await searchImages('x')
    expect(results.map(r => r.url)).toEqual(['https://w/0.jpg'])
  })

  it('returns [] when every source is empty', async () => {
    expect(await searchImages('nothing')).toEqual([])
  })
})
