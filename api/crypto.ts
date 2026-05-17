export const config = { runtime: 'edge' }

// 클라이언트가 직접 CoinGecko를 부르면 (1) 사용자 IP가 외부에 노출되고
// (2) CoinGecko 무료 tier가 IP당 30 req/min이라 모바일 캐리어 NAT에서 429를 만남.
// Edge 프록시 + Cache-Control로 사용자 수와 무관하게 분당 ~1회 호출로 수렴.
const CG_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd' +
  '&ids=bitcoin,ethereum,solana,binancecoin,dogecoin,cardano' +
  '&order=market_cap_desc&per_page=10&page=1'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 })
  try {
    const r = await fetch(CG_URL, { headers: { Accept: 'application/json' } })
    const text = await r.text()
    return new Response(text, {
      status: r.status,
      headers: {
        'Content-Type': 'application/json',
        // 60초 캐시 + 5분간은 stale 응답으로도 즉시 응답 (CoinGecko 보호)
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
