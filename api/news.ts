export const config = { runtime: 'edge' }

// HN topstories + item 30개를 서버에서 fan-out해서 클라이언트는 단 1회 호출.
// 사용자 IP 보호 + Vercel Edge 캐시로 동일 응답을 여러 사용자에게 재사용.
const HN_BASE = 'https://hacker-news.firebaseio.com/v0'

interface HNStory {
  id: number
  title?: string
  url?: string
  score?: number
  descendants?: number
  time?: number
  by?: string
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 })
  const url = new URL(req.url)
  const countRaw = Number(url.searchParams.get('count') ?? '30')
  const count = Math.max(1, Math.min(50, Number.isFinite(countRaw) ? countRaw : 30))

  try {
    const idsRes = await fetch(`${HN_BASE}/topstories.json`)
    if (!idsRes.ok) {
      return new Response(
        JSON.stringify({ error: `topstories ${idsRes.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }
    const ids = (await idsRes.json()) as number[]
    const top = ids.slice(0, count)
    const stories = await Promise.all(
      top.map(async (id) => {
        try {
          const r = await fetch(`${HN_BASE}/item/${id}.json`)
          if (!r.ok) return null
          return (await r.json()) as HNStory | null
        } catch {
          return null
        }
      }),
    )
    const out = stories.filter((s): s is HNStory => !!s && !!s.title)

    return new Response(JSON.stringify(out), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // HN topstories는 분 단위로 바뀜 — 5분 캐시 + 30분 SWR
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
