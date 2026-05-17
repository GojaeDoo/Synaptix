export const config = { runtime: 'edge' }

// 화이트리스트로 SSRF / 쿼터 오남용 방지
const ALLOWED_SYMBOLS = new Set([
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD',
])

export default async function handler(req: Request): Promise<Response> {
  const key = process.env.FINNHUB_API_KEY
  if (!key) {
    return json({ error: 'not-configured' }, 503)
  }

  const url = new URL(req.url)
  const symbol = url.searchParams.get('symbol')?.toUpperCase()

  if (!symbol || !ALLOWED_SYMBOLS.has(symbol)) {
    return json({ error: 'symbol not allowed' }, 400)
  }

  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`
  )
  const body = await res.text()

  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': res.ok
        ? 'public, s-maxage=60, stale-while-revalidate=120'
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
