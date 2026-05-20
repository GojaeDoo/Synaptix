import type { WeatherData, StockQuote, NewsArticle, ForecastData, ForecastSlot } from '@/types'

// 서버 키가 설정되지 않아 프록시가 503을 돌려준 경우. 훅에서 모의 데이터로 폴백한다.
export class ConfigError extends Error {
  constructor() {
    super('Upstream API key not configured on server')
    this.name = 'ConfigError'
  }
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const res = await fetch(url)
  if (res.status === 503) {
    const body = await safeJson(res)
    if (body && (body as { error?: string }).error === 'not-configured') {
      throw new ConfigError()
    }
  }
  if (!res.ok) throw new Error(`${label} 로드 실패 (${res.status})`)
  return res.json() as Promise<T>
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.clone().json()
  } catch {
    return null
  }
}

interface OWMWeatherResponse {
  name: string
  main: { temp: number; feels_like: number; humidity: number; pressure: number }
  weather: { id: number; description: string; icon: string }[]
  wind: { speed: number }
  visibility?: number
  clouds?: { all: number }
  sys?: { sunrise: number; sunset: number }
}

interface OWMForecastSlotResponse {
  dt: number
  main: { temp: number; feels_like: number; humidity: number }
  weather: { id: number; description: string; icon: string }[]
  wind: { speed: number }
  pop?: number
}

interface OWMForecastResponse {
  city?: { name: string }
  list?: OWMForecastSlotResponse[]
}

function mapWeather(d: OWMWeatherResponse): WeatherData {
  return {
    city: d.name,
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    description: d.weather[0].description,
    humidity: d.main.humidity,
    windSpeed: d.wind.speed,
    icon: d.weather[0].icon,
    code: d.weather[0].id,
    pressure: d.main.pressure,
    visibility: d.visibility,
    clouds: d.clouds?.all,
    sunrise: d.sys?.sunrise,
    sunset: d.sys?.sunset,
  }
}

function mapForecastSlot(d: OWMForecastSlotResponse): ForecastSlot {
  return {
    ts: d.dt,
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    description: d.weather[0].description,
    icon: d.weather[0].icon,
    code: d.weather[0].id,
    pop: d.pop ?? 0,
    humidity: d.main.humidity,
    windSpeed: d.wind.speed,
  }
}

function mapForecast(d: OWMForecastResponse): ForecastData {
  return {
    city: d.city?.name ?? '',
    slots: (d.list ?? []).map(mapForecastSlot),
  }
}

interface OWMGeocodeResult {
  name: string
  local_names?: Record<string, string>
  lat: number
  lon: number
  country: string
}

export async function geocodeCity(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const data = await fetchJson<OWMGeocodeResult[]>(
    `/api/weather?type=geocode&city=${encodeURIComponent(city)}`,
    '위치 검색'
  )
  if (!Array.isArray(data) || data.length === 0) return null
  const r = data[0]
  return { lat: r.lat, lon: r.lon, name: r.local_names?.ko ?? r.name }
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const data = await fetchJson<OWMWeatherResponse>(
    `/api/weather?type=current&city=${encodeURIComponent(city)}`,
    '날씨 데이터'
  )
  return mapWeather(data)
}

// 한글 도시명도 처리: 일단 q=...로 시도하고, 실패하면 geocode → coords로 폴백.
export async function fetchWeatherSmart(city: string): Promise<WeatherData> {
  try {
    return await fetchWeather(city)
  } catch (e) {
    if (e instanceof ConfigError) throw e
    const geo = await geocodeCity(city)
    if (!geo) throw new Error(`'${city}' 위치를 찾지 못했습니다`)
    const data = await fetchWeatherByCoords(geo.lat, geo.lon)
    return { ...data, city: geo.name }
  }
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const data = await fetchJson<OWMWeatherResponse>(
    `/api/weather?type=current&lat=${lat}&lon=${lon}`,
    '날씨 데이터'
  )
  return mapWeather(data)
}

export async function fetchForecast(city: string): Promise<ForecastData> {
  const data = await fetchJson<OWMForecastResponse>(
    `/api/weather?type=forecast&city=${encodeURIComponent(city)}`,
    '예보 데이터'
  )
  return mapForecast(data)
}

export async function fetchForecastByCoords(lat: number, lon: number): Promise<ForecastData> {
  const data = await fetchJson<OWMForecastResponse>(
    `/api/weather?type=forecast&lat=${lat}&lon=${lon}`,
    '예보 데이터'
  )
  return mapForecast(data)
}

const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple', TSLA: 'Tesla', NVDA: 'NVIDIA',
  MSFT: 'Microsoft', GOOGL: 'Google', AMZN: 'Amazon',
  META: 'Meta', AMD: 'AMD',
}

interface FinnhubQuoteResponse {
  c: number  // current
  d?: number // change
  dp?: number // change percent
  h: number  // high
  l: number  // low
  o: number  // open
  pc: number // prev close
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const d = await fetchJson<FinnhubQuoteResponse>(
    `/api/stock?symbol=${encodeURIComponent(symbol)}`,
    `${symbol} 데이터`
  )
  return {
    symbol,
    name: STOCK_NAMES[symbol] || symbol,
    price: d.c,
    change: +(d.d ?? 0).toFixed(2),
    changePercent: +(d.dp ?? 0).toFixed(2),
    high: d.h,
    low: d.l,
    open: d.o,
    prevClose: d.pc,
  }
}

interface CoinGeckoMarketResponse {
  symbol: string
  name: string
  current_price: number
  price_change_24h?: number
  price_change_percentage_24h?: number
  high_24h?: number
  low_24h?: number
}

export async function fetchCryptos(): Promise<StockQuote[]> {
  const data = await fetchJson<CoinGeckoMarketResponse[]>('/api/crypto', '암호화폐 데이터')
  return data.map((c) => {
    const change = +(c.price_change_24h ?? 0).toFixed(2)
    const prevClose = c.current_price - change
    return {
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change,
      changePercent: +(c.price_change_percentage_24h ?? 0).toFixed(2),
      high: c.high_24h ?? c.current_price,
      low: c.low_24h ?? c.current_price,
      open: prevClose,
      prevClose,
    }
  })
}

interface HNStory {
  id: number
  title?: string
  url?: string
  score?: number
  descendants?: number
  time?: number
  by?: string
}

export async function fetchHackerNews(count = 30): Promise<NewsArticle[]> {
  const stories = await fetchJson<HNStory[]>(`/api/news?count=${count}`, 'Hacker News 데이터')
  return stories
    .filter((s) => !!s.title)
    .map((s) => ({
      title: s.title!,
      description: null,
      url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
      source: { name: `HN ▲${s.score ?? 0} · 💬${s.descendants ?? 0}` },
      publishedAt: new Date((s.time ?? 0) * 1000).toISOString(),
      urlToImage: null,
    }))
}
