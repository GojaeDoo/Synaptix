import { defineConfig, loadEnv, type PluginOption } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { validateChatPayload } from './api/_chat-validation'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const MODEL = 'gemini-2.5-flash'

const WEATHER_BASE = 'https://api.openweathermap.org/data/2.5'
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0'
const FINNHUB_BASE = 'https://finnhub.io/api/v1'
const HN_BASE = 'https://hacker-news.firebaseio.com/v0'
const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd' +
  '&ids=bitcoin,ethereum,solana,binancecoin,dogecoin,cardano' +
  '&order=market_cap_desc&per_page=10&page=1'

const ALLOWED_STOCK_SYMBOLS = new Set([
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD',
])

const RATE_LIMIT_WINDOW = '1 m'
const RATE_LIMIT_MAX = 10

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function buildRatelimit(url: string | undefined, token: string | undefined): Ratelimit | null {
  if (!url || !token) return null
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW),
    analytics: false,
    prefix: 'synaptix:chat',
  })
}

function getClientIp(req: IncomingMessage): string {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim()
  if (Array.isArray(xff) && xff.length) return xff[0].split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

function localWeatherApi(key: string | undefined): PluginOption {
  return {
    name: 'local-weather-api',
    configureServer(server) {
      server.middlewares.use('/api/weather', async (req, res, next) => {
        if (req.method !== 'GET') return next()
        if (!key) return sendJson(res, 503, { error: 'not-configured' })
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const type = url.searchParams.get('type')
          const city = url.searchParams.get('city')
          const lat = url.searchParams.get('lat')
          const lon = url.searchParams.get('lon')

          // 한글 도시명 등은 /weather?q=...로 404가 흔해서 geocoding 경유가 필요.
          if (type === 'geocode') {
            if (!city) return sendJson(res, 400, { error: 'city required' })
            const params = new URLSearchParams({ q: city, limit: '1', appid: key })
            const r = await fetch(`${GEO_BASE}/direct?${params}`)
            const text = await r.text()
            res.statusCode = r.status
            res.setHeader('Content-Type', 'application/json')
            res.end(text)
            return
          }

          if (type !== 'current' && type !== 'forecast') {
            return sendJson(res, 400, { error: 'type must be "current", "forecast", or "geocode"' })
          }
          const params = new URLSearchParams({ appid: key, units: 'metric', lang: 'kr' })
          if (lat && lon) {
            if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
              return sendJson(res, 400, { error: 'lat/lon must be numeric' })
            }
            params.set('lat', lat)
            params.set('lon', lon)
          } else if (city) {
            params.set('q', city)
          } else {
            return sendJson(res, 400, { error: 'city or lat/lon required' })
          }

          const path = type === 'current' ? 'weather' : 'forecast'
          const r = await fetch(`${WEATHER_BASE}/${path}?${params}`)
          const text = await r.text()
          res.statusCode = r.status
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        } catch (e) {
          sendJson(res, 500, { error: e instanceof Error ? e.message : 'Unknown' })
        }
      })
    },
  }
}

function localCryptoApi(): PluginOption {
  return {
    name: 'local-crypto-api',
    configureServer(server) {
      server.middlewares.use('/api/crypto', async (req, res, next) => {
        if (req.method !== 'GET') return next()
        try {
          const r = await fetch(COINGECKO_URL, { headers: { Accept: 'application/json' } })
          const text = await r.text()
          res.statusCode = r.status
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        } catch (e) {
          sendJson(res, 502, { error: e instanceof Error ? e.message : 'Unknown' })
        }
      })
    },
  }
}

interface HNStoryDev {
  id: number
  title?: string
}

function localNewsApi(): PluginOption {
  return {
    name: 'local-news-api',
    configureServer(server) {
      server.middlewares.use('/api/news', async (req, res, next) => {
        if (req.method !== 'GET') return next()
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const countRaw = Number(url.searchParams.get('count') ?? '30')
          const count = Math.max(1, Math.min(50, Number.isFinite(countRaw) ? countRaw : 30))

          const idsRes = await fetch(`${HN_BASE}/topstories.json`)
          if (!idsRes.ok) return sendJson(res, 502, { error: `topstories ${idsRes.status}` })
          const ids = (await idsRes.json()) as number[]
          const top = ids.slice(0, count)
          const stories = await Promise.all(
            top.map(async (id) => {
              try {
                const r = await fetch(`${HN_BASE}/item/${id}.json`)
                if (!r.ok) return null
                return (await r.json()) as HNStoryDev | null
              } catch {
                return null
              }
            }),
          )
          const out = stories.filter((s): s is HNStoryDev => !!s && !!s.title)
          sendJson(res, 200, out)
        } catch (e) {
          sendJson(res, 502, { error: e instanceof Error ? e.message : 'Unknown' })
        }
      })
    },
  }
}

function localStockApi(key: string | undefined): PluginOption {
  return {
    name: 'local-stock-api',
    configureServer(server) {
      server.middlewares.use('/api/stock', async (req, res, next) => {
        if (req.method !== 'GET') return next()
        if (!key) return sendJson(res, 503, { error: 'not-configured' })
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const symbol = url.searchParams.get('symbol')?.toUpperCase()
          if (!symbol || !ALLOWED_STOCK_SYMBOLS.has(symbol)) {
            return sendJson(res, 400, { error: 'symbol not allowed' })
          }
          const r = await fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${key}`)
          const text = await r.text()
          res.statusCode = r.status
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        } catch (e) {
          sendJson(res, 500, { error: e instanceof Error ? e.message : 'Unknown' })
        }
      })
    },
  }
}

function localPlacesApi(key: string | undefined): PluginOption {
  return {
    name: 'local-places-api',
    configureServer(server) {
      server.middlewares.use('/api/places', async (req, res, next) => {
        if (req.method !== 'GET') return next()
        if (!key) return sendJson(res, 503, { error: 'not-configured' })
        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const query = url.searchParams.get('query')?.trim()
          if (!query) return sendJson(res, 400, { error: 'query required' })

          const params = new URLSearchParams({ query, size: '15' })
          const x = url.searchParams.get('x')
          const y = url.searchParams.get('y')
          if (x && y && Number.isFinite(Number(x)) && Number.isFinite(Number(y))) {
            params.set('x', x)
            params.set('y', y)
            params.set('sort', 'distance')
          }

          const r = await fetch(`${KAKAO_KEYWORD_URL}?${params}`, {
            headers: { Authorization: `KakaoAK ${key}` },
          })
          const text = await r.text()
          res.statusCode = r.status
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        } catch (e) {
          sendJson(res, 500, { error: e instanceof Error ? e.message : 'Unknown' })
        }
      })
    },
  }
}

function localChatApi(
  geminiKey: string | undefined,
  upstashUrl: string | undefined,
  upstashToken: string | undefined,
): PluginOption {
  const ratelimit = buildRatelimit(upstashUrl, upstashToken)
  return {
    name: 'local-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', (req, res, next) => {
        if (req.method !== 'POST') return next()
        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        req.on('end', async () => {
          if (!geminiKey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set in .env' }))
            return
          }
          if (ratelimit) {
            try {
              const ip = getClientIp(req)
              const { success, limit, remaining, reset } = await ratelimit.limit(ip)
              if (!success) {
                const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
                res.statusCode = 429
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Retry-After', String(retryAfter))
                res.setHeader('X-RateLimit-Limit', String(limit))
                res.setHeader('X-RateLimit-Remaining', String(remaining))
                res.setHeader('X-RateLimit-Reset', String(reset))
                res.end(JSON.stringify({
                  error: { message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
                }))
                return
              }
            } catch (e) {
              console.error('[chat] ratelimit error', e)
            }
          }
          try {
            let rawBody: unknown
            try {
              rawBody = JSON.parse(raw)
            } catch {
              sendJson(res, 400, { error: 'Invalid JSON' })
              return
            }

            const valid = validateChatPayload(rawBody)
            if (!valid.ok) {
              sendJson(res, valid.status, { error: { message: valid.message } })
              return
            }
            const { messages, tools } = valid.value

            const callApi = (withTools: boolean) =>
              fetch(GEMINI_URL, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${geminiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: MODEL,
                  messages,
                  ...(withTools && tools ? { tools, tool_choice: 'auto' } : {}),
                }),
              })

            let r = await callApi(true)
            let text = await r.text()

            // 503 UNAVAILABLE: Gemini 서버 일시 과부하 → 1.5초 후 한 번 재시도
            if (r.status === 503) {
              await new Promise((resolve) => setTimeout(resolve, 1500))
              const retry = await callApi(true)
              if (retry.ok) {
                text = await retry.text()
                r = retry
              }
            }

            // tool call 실패 시 tool 없이 한 번 더 호출 (단, 429/503은 별도 처리)
            if (!r.ok && tools && r.status >= 400 && r.status < 500 && r.status !== 429) {
              const retry = await callApi(false)
              if (retry.ok) {
                text = await retry.text()
                r = retry
              }
            }

            if (!r.ok) {
              console.error(`[chat] Gemini ${r.status} →`, text.slice(0, 600))
            }

            if (r.status === 429) {
              text = JSON.stringify({
                error: { message: '잠시 사용량이 많아요. 1분 후 다시 시도해주세요.' },
              })
            }
            if (r.status === 503) {
              text = JSON.stringify({
                error: { message: 'AI 서버가 일시적으로 바빠요. 잠시 후 다시 시도해주세요.' },
              })
            }

            res.statusCode = r.status
            res.setHeader('Content-Type', 'application/json')
            res.end(text)
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [
    react(),
    tailwindcss(),
    localChatApi(env.GEMINI_API_KEY, env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN),
    localWeatherApi(env.OPENWEATHER_API_KEY),
    localStockApi(env.FINNHUB_API_KEY),
    localCryptoApi(),
    localNewsApi(),
    localPlacesApi(env.KAKAO_REST_API_KEY),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      workbox: {
        // 생성된 서비스워커가 push/notificationclick 핸들러를 불러오도록 주입.
        // public/sw-push.js → 빌드 시 dist 루트로 복사됨.
        importScripts: ['/sw-push.js'],
      },
      manifest: {
        name: 'Synaptix',
        short_name: 'Synaptix',
        description: 'AI-powered personal dashboard — 날씨, 주식, 뉴스, 할일, 가계부',
        theme_color: '#09090F',
        background_color: '#09090F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        categories: ['productivity', 'finance', 'utilities'],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  }
})
