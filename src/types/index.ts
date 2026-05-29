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

// 카카오 로컬 검색으로 찾은 장소. 일정(Todo)에 첨부되어 "어디서"를 기록한다.
export interface PlaceLocation {
  name: string
  address: string
  lat: number
  lng: number
  category?: string
  url?: string | null
}

// 검색 결과 한 건. PlaceLocation에 검색 표시용 메타(전화/거리)를 더한 형태.
export interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  category: string
  phone: string | null
  url: string | null
  distance: number | null
}

export interface Todo {
  id: string
  title: string
  completed: boolean
  due_date: string | null
  created_at: string
  priority: 'low' | 'medium' | 'high'
  location?: PlaceLocation | null
}

// 코스(데이트/나들이 동선) — 시간순으로 묶인 여러 장소.
// 캘린더(todo)와 독립적이며, 링크로 인코딩해 공유한다.
export interface CourseStop {
  id: string
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
  memo: string      // 예: "데이트", "식사", "산책"
  location: PlaceLocation
}

export interface Course {
  title: string
  date: string | null // YYYY-MM-DD (선택)
  stops: CourseStop[]
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

export type WidgetKey = 'weather' | 'stocks' | 'news' | 'calendar' | 'budget' | 'places'
