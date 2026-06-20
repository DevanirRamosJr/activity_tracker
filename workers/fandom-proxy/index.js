const FANDOM = 'https://services.fandom.com/unified-search/page-search'

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) })
    }

    const url = new URL(request.url)
    const target = `${FANDOM}${url.search}`
    const res = await fetch(target)
    const body = await res.text()

    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(request),
      },
    })
  },
}

function corsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
