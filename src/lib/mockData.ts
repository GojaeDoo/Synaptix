import type { WeatherData, StockQuote, ForecastData, ForecastSlot, NewsArticle } from '@/types'

const NOW = Math.floor(Date.now() / 1000)

export const mockWeather: WeatherData = {
  city: 'Seoul',
  temp: 24,
  feelsLike: 22,
  description: '맑음',
  humidity: 48,
  windSpeed: 3.5,
  icon: '01d',
  code: 800,
  pressure: 1015,
  visibility: 10000,
  clouds: 12,
  sunrise: NOW - 3600 * 3,
  sunset: NOW + 3600 * 6,
}

const ICON_CYCLE = ['01d', '02d', '03d', '04d', '10d', '02n', '01n']
const DESC_CYCLE = ['맑음', '구름조금', '구름많음', '흐림', '약한 비', '구름조금', '맑음']

export const mockForecast: ForecastData = {
  city: 'Seoul',
  slots: Array.from({ length: 40 }, (_, i): ForecastSlot => {
    const hourOfDay = ((i * 3) + new Date().getHours()) % 24
    const dayWave = Math.sin(((hourOfDay - 6) / 24) * Math.PI * 2)
    const drift = Math.sin(i / 6) * 2
    return {
      ts: NOW + i * 3 * 3600,
      temp: Math.round(22 + dayWave * 5 + drift),
      feelsLike: Math.round(20 + dayWave * 5 + drift),
      description: DESC_CYCLE[i % DESC_CYCLE.length],
      icon: ICON_CYCLE[i % ICON_CYCLE.length],
      code: i % 7 === 4 ? 500 : 800,
      pop: i % 7 === 4 ? 0.6 : 0.05,
      humidity: 45 + (i % 8) * 4,
      windSpeed: 2 + (i % 5) * 0.6,
    }
  }),
}

export const mockStocks: StockQuote[] = [
  { symbol: 'AAPL', name: 'Apple', price: 185.5, change: 2.3, changePercent: 1.26, high: 187.2, low: 183.1, open: 183.5, prevClose: 183.2 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 875.4, change: 18.6, changePercent: 2.17, high: 882.0, low: 858.5, open: 860.0, prevClose: 856.8 },
  { symbol: 'TSLA', name: 'Tesla', price: 248.3, change: -4.2, changePercent: -1.66, high: 255.1, low: 246.8, open: 253.0, prevClose: 252.5 },
  { symbol: 'MSFT', name: 'Microsoft', price: 415.2, change: 3.1, changePercent: 0.75, high: 418.5, low: 412.3, open: 413.0, prevClose: 412.1 },
  { symbol: 'GOOGL', name: 'Google', price: 168.9, change: -1.4, changePercent: -0.82, high: 171.2, low: 167.8, open: 170.5, prevClose: 170.3 },
]

export const mockCryptos: StockQuote[] = [
  { symbol: 'BTC',  name: 'Bitcoin',     price: 96500, change: 1240,  changePercent: 1.30,  high: 97200, low: 94800, open: 95260, prevClose: 95260 },
  { symbol: 'ETH',  name: 'Ethereum',    price: 3420,  change: -45,   changePercent: -1.30, high: 3490,  low: 3380,  open: 3465,  prevClose: 3465 },
  { symbol: 'SOL',  name: 'Solana',      price: 198,   change: 5.6,   changePercent: 2.91,  high: 202,   low: 191,   open: 192.4, prevClose: 192.4 },
  { symbol: 'BNB',  name: 'BNB',         price: 695,   change: 8.2,   changePercent: 1.19,  high: 702,   low: 685,   open: 686.8, prevClose: 686.8 },
  { symbol: 'DOGE', name: 'Dogecoin',    price: 0.38,  change: 0.012, changePercent: 3.26,  high: 0.39,  low: 0.37,  open: 0.368, prevClose: 0.368 },
  { symbol: 'ADA',  name: 'Cardano',     price: 1.05,  change: -0.02, changePercent: -1.87, high: 1.08,  low: 1.03,  open: 1.07,  prevClose: 1.07 },
]

const NEWS_NOW = Date.now()
export const mockNews: NewsArticle[] = [
  { title: 'Show HN: A self-hosted dashboard with AI tool calling',                  description: null, url: 'https://news.ycombinator.com/', source: { name: 'HN ▲342 · 💬87' },  publishedAt: new Date(NEWS_NOW -  60 * 60 * 1000).toISOString(), urlToImage: null },
  { title: 'Why edge functions are eating serverless',                               description: null, url: 'https://news.ycombinator.com/', source: { name: 'HN ▲218 · 💬54' },  publishedAt: new Date(NEWS_NOW -  90 * 60 * 1000).toISOString(), urlToImage: null },
  { title: 'React 19 compiler — what the auto-memoization actually does',            description: null, url: 'https://news.ycombinator.com/', source: { name: 'HN ▲187 · 💬41' },  publishedAt: new Date(NEWS_NOW - 120 * 60 * 1000).toISOString(), urlToImage: null },
  { title: 'Postgres RLS at scale: lessons from a year in production',               description: null, url: 'https://news.ycombinator.com/', source: { name: 'HN ▲156 · 💬33' },  publishedAt: new Date(NEWS_NOW - 180 * 60 * 1000).toISOString(), urlToImage: null },
  { title: 'TypeScript 6 type narrowing improvements',                               description: null, url: 'https://news.ycombinator.com/', source: { name: 'HN ▲143 · 💬29' },  publishedAt: new Date(NEWS_NOW - 240 * 60 * 1000).toISOString(), urlToImage: null },
  { title: 'A pragmatic guide to prompt caching in LLM apps',                        description: null, url: 'https://news.ycombinator.com/', source: { name: 'HN ▲118 · 💬22' },  publishedAt: new Date(NEWS_NOW - 300 * 60 * 1000).toISOString(), urlToImage: null },
]
