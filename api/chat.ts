import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const config = { runtime: 'edge' }

// Gemini의 OpenAI 호환 endpoint — 요청/응답 스키마가 OpenAI와 동일해서 클라이언트 코드 무수정
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const MODEL = 'gemini-2.5-flash'

// IP당 분당 10회 sliding window. Upstash 미설정 시 enforcement 생략 (dev 편의)
const RATE_LIMIT_WINDOW = '1 m'
const RATE_LIMIT_MAX = 10

let ratelimit: Ratelimit | null = null
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW),
    analytics: false,
    prefix: 'synaptix:chat',
  })
  return ratelimit
}

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rl = getRatelimit()
  if (rl) {
    const ip = getClientIp(req)
    try {
      const { success, limit, remaining, reset } = await rl.limit(ip)
      if (!success) {
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
        return new Response(
          JSON.stringify({
            error: { message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(reset),
            },
          },
        )
      }
    } catch (e) {
      // Upstash 장애 시 fail-open (UX 우선). 로그만 남기고 통과
      console.error('[chat] ratelimit error', e)
    }
  }

  let body: { messages?: unknown[]; tools?: unknown[] }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const callApi = async (withTools: boolean) =>
    fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: body.messages,
        ...(withTools && body.tools ? { tools: body.tools, tool_choice: 'auto' } : {}),
      }),
    })

  let res = await callApi(true)
  let data = await res.text()

  // 503 UNAVAILABLE: Gemini 일시 과부하 → 1.5초 후 한 번 재시도
  if (res.status === 503) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const retry = await callApi(true)
    if (retry.ok) {
      data = await retry.text()
      res = retry
    }
  }

  // tool call이 실패하면 tool 없이 한 번 더 호출해 텍스트 응답으로 폴백
  if (!res.ok && body.tools && res.status >= 400 && res.status < 500 && res.status !== 429) {
    const retry = await callApi(false)
    if (retry.ok) {
      data = await retry.text()
      res = retry
    }
  }

  if (res.status === 429) {
    data = JSON.stringify({
      error: { message: '잠시 사용량이 많아요. 1분 후 다시 시도해주세요.' },
    })
  }
  if (res.status === 503) {
    data = JSON.stringify({
      error: { message: 'AI 서버가 일시적으로 바빠요. 잠시 후 다시 시도해주세요.' },
    })
  }

  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
