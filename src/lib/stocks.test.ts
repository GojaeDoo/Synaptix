import { describe, it, expect } from 'vitest'
import { filterAndSort, computeStats } from './stocks'
import type { StockQuote } from '@/types'

function quote(over: Partial<StockQuote> & Pick<StockQuote, 'symbol'>): StockQuote {
  return {
    name: over.name ?? over.symbol,
    price: over.price ?? 0,
    change: over.change ?? 0,
    changePercent: over.changePercent ?? 0,
    high: over.high ?? 0,
    low: over.low ?? 0,
    open: over.open ?? 0,
    prevClose: over.prevClose ?? 0,
    ...over,
  }
}

describe('filterAndSort', () => {
  const quotes = [
    quote({ symbol: 'AAPL', name: 'Apple', price: 180, changePercent: 1.5 }),
    quote({ symbol: 'TSLA', name: 'Tesla', price: 240, changePercent: -2.0 }),
    quote({ symbol: 'MSFT', name: 'Microsoft', price: 400, changePercent: 0.5 }),
  ]

  it('filters by symbol or name (case-insensitive)', () => {
    expect(filterAndSort(quotes, 'apple', 'symbol').map((s) => s.symbol)).toEqual(['AAPL'])
    expect(filterAndSort(quotes, 'tsla', 'symbol').map((s) => s.symbol)).toEqual(['TSLA'])
  })

  it('sorts by change descending by default', () => {
    expect(filterAndSort(quotes, '', 'change-desc').map((s) => s.symbol)).toEqual(['AAPL', 'MSFT', 'TSLA'])
  })

  it('sorts by change ascending, price, and symbol', () => {
    expect(filterAndSort(quotes, '', 'change-asc').map((s) => s.symbol)).toEqual(['TSLA', 'MSFT', 'AAPL'])
    expect(filterAndSort(quotes, '', 'price-desc').map((s) => s.symbol)).toEqual(['MSFT', 'TSLA', 'AAPL'])
    expect(filterAndSort(quotes, '', 'price-asc').map((s) => s.symbol)).toEqual(['AAPL', 'TSLA', 'MSFT'])
    expect(filterAndSort(quotes, '', 'symbol').map((s) => s.symbol)).toEqual(['AAPL', 'MSFT', 'TSLA'])
  })
})

describe('computeStats', () => {
  it('counts up/down/flat and averages the change', () => {
    const quotes = [
      quote({ symbol: 'A', changePercent: 2 }),
      quote({ symbol: 'B', changePercent: -1 }),
      quote({ symbol: 'C', changePercent: 0 }),
      quote({ symbol: 'D', changePercent: 3 }),
    ]
    expect(computeStats(quotes)).toEqual({ total: 4, up: 2, down: 1, flat: 1, avgChange: 1 })
  })

  it('returns a zero average for an empty list', () => {
    expect(computeStats([])).toEqual({ total: 0, up: 0, down: 0, flat: 0, avgChange: 0 })
  })
})
