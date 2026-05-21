import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  fetchStockQuote,
  fetchCryptos,
  fetchHackerNews,
  geocodeCity,
  fetchWeather,
  fetchWeatherSmart,
  ConfigError,
} from './api'

// 최소한의 Response 더블 — fetchJson이 쓰는 ok/status/json()/clone() 만 흉내낸다.
function makeRes(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    clone: () => makeRes(body, status),
  } as unknown as Response
}

function stubFetch(impl: (url: string) => Response | Promise<Response>) {
  const fn = vi.fn((input: RequestInfo | URL) => Promise.resolve(impl(String(input))))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchStockQuote', () => {
  it('maps a Finnhub quote and resolves the display name', async () => {
    stubFetch(() => makeRes({ c: 150.2, d: 1.234, dp: 0.834, h: 152, l: 149, o: 150, pc: 149 }))
    const q = await fetchStockQuote('AAPL')
    expect(q).toMatchObject({
      symbol: 'AAPL',
      name: 'Apple',
      price: 150.2,
      change: 1.23, // 소수 둘째 자리 반올림
      changePercent: 0.83,
      prevClose: 149,
    })
  })

  it('defaults change fields to 0 when Finnhub omits them', async () => {
    stubFetch(() => makeRes({ c: 10, h: 11, l: 9, o: 10, pc: 10 }))
    const q = await fetchStockQuote('NVDA')
    expect(q.change).toBe(0)
    expect(q.changePercent).toBe(0)
  })

  it('throws on a non-ok upstream response', async () => {
    stubFetch(() => makeRes({}, 500))
    await expect(fetchStockQuote('AAPL')).rejects.toThrow(/500/)
  })
})

describe('fetchCryptos', () => {
  it('maps CoinGecko markets and derives prevClose from 24h change', async () => {
    stubFetch(() =>
      makeRes([
        {
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          price_change_24h: 1000,
          price_change_percentage_24h: 2.04,
          high_24h: 51000,
          low_24h: 48000,
        },
      ]),
    )
    const [btc] = await fetchCryptos()
    expect(btc.symbol).toBe('BTC') // 대문자화
    expect(btc.price).toBe(50000)
    expect(btc.change).toBe(1000)
    expect(btc.prevClose).toBe(49000) // price - change
  })
})

describe('fetchHackerNews', () => {
  it('drops titleless stories and builds the source label', async () => {
    stubFetch(() =>
      makeRes([
        { id: 1, title: 'Hello', url: 'https://x.com', score: 42, descendants: 7, time: 1_700_000_000 },
        { id: 2 }, // 제목 없음 → 제외
      ]),
    )
    const news = await fetchHackerNews()
    expect(news).toHaveLength(1)
    expect(news[0].title).toBe('Hello')
    expect(news[0].source.name).toContain('42')
    expect(news[0].source.name).toContain('7')
  })

  it('falls back to the HN item URL when a story has no url', async () => {
    stubFetch(() => makeRes([{ id: 99, title: 'No URL', score: 1, descendants: 0, time: 1 }]))
    const [item] = await fetchHackerNews()
    expect(item.url).toBe('https://news.ycombinator.com/item?id=99')
  })
})

describe('geocodeCity', () => {
  it('prefers the Korean local name', async () => {
    stubFetch(() =>
      makeRes([{ name: 'Chuncheon', local_names: { ko: '춘천' }, lat: 37.8, lon: 127.7, country: 'KR' }]),
    )
    const geo = await geocodeCity('춘천')
    expect(geo).toEqual({ lat: 37.8, lon: 127.7, name: '춘천' })
  })

  it('returns null when no match is found', async () => {
    stubFetch(() => makeRes([]))
    expect(await geocodeCity('asdfqwer')).toBeNull()
  })
})

describe('ConfigError handling', () => {
  it('throws ConfigError when the proxy reports a missing key (503 not-configured)', async () => {
    stubFetch(() => makeRes({ error: 'not-configured' }, 503))
    await expect(fetchWeather('Seoul')).rejects.toBeInstanceOf(ConfigError)
  })
})

describe('fetchWeatherSmart', () => {
  it('falls back to geocode + coords when the direct city lookup fails', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.includes('type=current') && url.includes('city=')) return makeRes({}, 404) // 직접 조회 실패
      if (url.includes('type=geocode')) {
        return makeRes([{ name: 'Chuncheon', local_names: { ko: '춘천' }, lat: 37.8, lon: 127.7, country: 'KR' }])
      }
      // 좌표 기반 재조회 성공
      return makeRes({
        name: 'Chuncheon',
        main: { temp: 7.4, feels_like: 5.1, humidity: 60, pressure: 1012 },
        weather: [{ id: 800, description: '맑음', icon: '01d' }],
        wind: { speed: 2 },
      })
    })
    const w = await fetchWeatherSmart('춘천')
    expect(w.temp).toBe(7) // 반올림
    expect(w.city).toBe('춘천') // geocode의 한글명으로 덮어씀
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not attempt a fallback when the failure is a ConfigError', async () => {
    const fetchMock = stubFetch(() => makeRes({ error: 'not-configured' }, 503))
    await expect(fetchWeatherSmart('Seoul')).rejects.toBeInstanceOf(ConfigError)
    expect(fetchMock).toHaveBeenCalledTimes(1) // geocode 시도 안 함
  })
})
