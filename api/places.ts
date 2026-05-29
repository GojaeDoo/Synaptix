export const config = { runtime: 'edge' }

// 카카오 로컬 키워드 검색 프록시.
// REST 키를 클라이언트에 노출하지 않고 Edge 뒤에 숨긴다(weather/stock과 동일 패턴).
// 키가 없으면 503 not-configured → 클라이언트가 mock 장소로 폴백한다.
const BASE = 'https://dapi.kakao.com/v2/local/search/keyword.json'

export default async function handler(req: Request): Promise<Response> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) {
    return json({ error: 'not-configured' }, 503)
  }

  const url = new URL(req.url)
  const query = url.searchParams.get('query')?.trim()
  if (!query) {
    return json({ error: 'query required' }, 400)
  }

  const params = new URLSearchParams({ query, size: '15' })

  // 중심 좌표(x=lng, y=lat)가 오면 거리순 정렬. 둘 다 숫자일 때만 적용.
  const x = url.searchParams.get('x')
  const y = url.searchParams.get('y')
  if (x && y && isFiniteNum(x) && isFiniteNum(y)) {
    params.set('x', x)
    params.set('y', y)
    params.set('sort', 'distance')
  }

  const res = await fetch(`${BASE}?${params}`, {
    headers: { Authorization: `KakaoAK ${key}` },
  })
  const body = await res.text()

  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      // 같은 검색어는 자주 반복되므로 CDN에 1시간 캐시.
      'Cache-Control': res.ok
        ? 'public, s-maxage=3600, stale-while-revalidate=86400'
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
  return Number.isFinite(Number(s))
}
