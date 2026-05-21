import type { StockQuote } from '@/types'

// 시장 위젯의 순수 필터/정렬/집계 로직 — UI/상태와 분리해 단위 테스트가 가능하도록 모았다.
// StocksDetail과 그 하위 컴포넌트가 공유한다.

export type Tab = 'stocks' | 'crypto'
export type SortMode = 'change-desc' | 'change-asc' | 'price-desc' | 'price-asc' | 'symbol'

export function filterAndSort(quotes: StockQuote[], search: string, sort: SortMode): StockQuote[] {
  const q = search.trim().toLowerCase()
  let filtered = quotes
  if (q) {
    filtered = filtered.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    )
  }
  const sorted = [...filtered]
  switch (sort) {
    case 'change-asc':
      sorted.sort((a, b) => a.changePercent - b.changePercent)
      break
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price)
      break
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price)
      break
    case 'symbol':
      sorted.sort((a, b) => a.symbol.localeCompare(b.symbol))
      break
    default:
      sorted.sort((a, b) => b.changePercent - a.changePercent)
  }
  return sorted
}

export interface MarketStats {
  total: number
  up: number
  down: number
  flat: number
  avgChange: number
}

export function computeStats(quotes: StockQuote[]): MarketStats {
  const up = quotes.filter((s) => s.changePercent > 0).length
  const down = quotes.filter((s) => s.changePercent < 0).length
  const flat = quotes.length - up - down
  const avgChange =
    quotes.length > 0 ? quotes.reduce((s, q) => s + q.changePercent, 0) / quotes.length : 0
  return { total: quotes.length, up, down, flat, avgChange }
}
