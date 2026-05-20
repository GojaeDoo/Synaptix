export const config = { runtime: 'edge' }

const BASE = 'https://api.openweathermap.org/data/2.5'
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0'

export default async function handler(req: Request): Promise<Response> {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) {
    return json({ error: 'not-configured' }, 503)
  }

  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const city = url.searchParams.get('city')
  const lat = url.searchParams.get('lat')
  const lon = url.searchParams.get('lon')

  // 한글 도시명은 /weather?q=...로는 거의 항상 404가 나서, geocoding을 거치는 별도 타입을 제공.
  if (type === 'geocode') {
    if (!city) return json({ error: 'city required' }, 400)
    const params = new URLSearchParams({ q: city, limit: '1', appid: key })
    const res = await fetch(`${GEO_BASE}/direct?${params}`)
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': res.ok
          ? 'public, s-maxage=86400, stale-while-revalidate=604800'
          : 'no-store',
      },
    })
  }

  if (type !== 'current' && type !== 'forecast') {
    return json({ error: 'type must be "current", "forecast", or "geocode"' }, 400)
  }

  const params = new URLSearchParams({ appid: key, units: 'metric', lang: 'kr' })
  if (lat && lon) {
    if (!isFiniteNum(lat) || !isFiniteNum(lon)) {
      return json({ error: 'lat/lon must be numeric' }, 400)
    }
    params.set('lat', lat)
    params.set('lon', lon)
  } else if (city) {
    params.set('q', city)
  } else {
    return json({ error: 'city or lat/lon required' }, 400)
  }

  const path = type === 'current' ? 'weather' : 'forecast'
  const res = await fetch(`${BASE}/${path}?${params}`)
  const body = await res.text()

  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': res.ok
        ? 'public, s-maxage=300, stale-while-revalidate=600'
        : 'no-store',
    },
  })
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function isFiniteNum(s: string) {
  const n = Number(s)
  return Number.isFinite(n)
}
