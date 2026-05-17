export interface WeatherData {
  city: string
  temp: number
  feelsLike: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
  code: number
  pressure?: number
  visibility?: number
  clouds?: number
  sunrise?: number
  sunset?: number
}

export interface ForecastSlot {
  ts: number          // unix seconds
  temp: number
  feelsLike: number
  description: string
  icon: string
  code: number
  pop: number         // probability of precipitation 0..1
  humidity: number
  windSpeed: number
}

export interface ForecastData {
  city: string
  slots: ForecastSlot[]    // every 3h, ~40 entries (5 days)
}

export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  prevClose: number
}

export interface NewsArticle {
  title: string
  description: string | null
  url: string
  source: { name: string }
  publishedAt: string
  urlToImage: string | null
}

export interface Todo {
  id: string
  title: string
  completed: boolean
  due_date: string | null
  created_at: string
  priority: 'low' | 'medium' | 'high'
}

export interface Transaction {
  id: string
  amount: number
  category: string
  description: string
  type: 'income' | 'expense'
  date: string
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface WidgetSettings {
  weatherCity: string
  stockSymbols: string[]
}

export type WidgetKey = 'weather' | 'stocks' | 'news' | 'calendar' | 'budget'
