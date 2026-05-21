import { describe, it, expect } from 'vitest'
import {
  getRange,
  filterByRange,
  summarize,
  computePie,
  filterAndSort,
  availableCategories,
  computeTrend,
} from './budget'
import type { Transaction } from '@/types'

// TZ=UTC 로 실행(package.json) — 날짜 경계가 결정적.
function tx(over: Partial<Transaction> & Pick<Transaction, 'amount' | 'type' | 'date'>): Transaction {
  return {
    id: over.id ?? Math.random().toString(36).slice(2),
    category: over.category ?? '기타',
    description: over.description ?? '',
    created_at: over.created_at ?? '2020-01-01T00:00:00Z',
    ...over,
  }
}

describe('getRange', () => {
  const anchor = new Date('2020-06-15T09:00:00Z')

  it('returns a single day for "day" mode', () => {
    const r = getRange('day', anchor, '', '')!
    expect(r.start.getUTCDate()).toBe(15)
    expect(r.end.getUTCDate()).toBe(15)
    expect(r.start < r.end).toBe(true)
  })

  it('returns the whole calendar month for "month" mode', () => {
    const r = getRange('month', anchor, '', '')!
    expect(r.start.getUTCDate()).toBe(1)
    expect(r.end.getUTCMonth()).toBe(5) // June (0-based)
    expect(r.end.getUTCDate()).toBe(30)
  })

  it('normalizes a reversed custom range', () => {
    const r = getRange('custom', anchor, '2020-06-20', '2020-06-10')!
    expect(r.start.getUTCDate()).toBe(10)
    expect(r.end.getUTCDate()).toBe(20)
  })

  it('returns null for "all"', () => {
    expect(getRange('all', anchor, '', '')).toBeNull()
  })
})

describe('filterByRange', () => {
  const txns = [
    tx({ amount: 1, type: 'expense', date: '2020-06-05' }),
    tx({ amount: 2, type: 'expense', date: '2020-06-25' }),
    tx({ amount: 3, type: 'expense', date: '2020-07-10' }),
  ]

  it('keeps only transactions within the range', () => {
    const r = getRange('month', new Date('2020-06-15T00:00:00Z'), '', '')
    expect(filterByRange(txns, r).map((t) => t.amount)).toEqual([1, 2])
  })

  it('returns everything when range is null (all)', () => {
    expect(filterByRange(txns, null)).toHaveLength(3)
  })
})

describe('summarize', () => {
  it('totals income, expense and balance', () => {
    const txns = [
      tx({ amount: 1000, type: 'income', date: '2020-06-01' }),
      tx({ amount: 300, type: 'expense', date: '2020-06-02' }),
      tx({ amount: 200, type: 'expense', date: '2020-06-03' }),
    ]
    expect(summarize(txns)).toEqual({ income: 1000, expense: 500, balance: 500 })
  })
})

describe('computePie', () => {
  it('aggregates expenses by category, descending, ignoring income', () => {
    const txns = [
      tx({ amount: 5000, type: 'income', category: '급여', date: '2020-06-01' }),
      tx({ amount: 100, type: 'expense', category: '식비', date: '2020-06-02' }),
      tx({ amount: 300, type: 'expense', category: '교통', date: '2020-06-03' }),
      tx({ amount: 200, type: 'expense', category: '식비', date: '2020-06-04' }),
    ]
    expect(computePie(txns)).toEqual([
      { name: '식비', value: 300 },
      { name: '교통', value: 300 },
    ].sort((a, b) => b.value - a.value)) // 동점이면 입력 순서 — 식비(300) 먼저
  })
})

describe('filterAndSort', () => {
  const txns = [
    tx({ id: 'a', amount: 100, type: 'expense', category: '식비', description: '점심', date: '2020-06-03' }),
    tx({ id: 'b', amount: 500, type: 'income', category: '급여', description: '월급', date: '2020-06-01' }),
    tx({ id: 'c', amount: 300, type: 'expense', category: '교통', description: '버스', date: '2020-06-02' }),
  ]

  it('filters by type', () => {
    const r = filterAndSort(txns, { typeFilter: 'expense', categoryFilter: 'all', search: '', sortMode: 'date-desc' })
    expect(r.map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('filters by category and search text', () => {
    const r = filterAndSort(txns, { typeFilter: 'all', categoryFilter: '교통', search: '버', sortMode: 'date-desc' })
    expect(r.map((t) => t.id)).toEqual(['c'])
  })

  it('sorts by amount ascending / descending', () => {
    const asc = filterAndSort(txns, { typeFilter: 'all', categoryFilter: 'all', search: '', sortMode: 'amount-asc' })
    expect(asc.map((t) => t.amount)).toEqual([100, 300, 500])
    const desc = filterAndSort(txns, { typeFilter: 'all', categoryFilter: 'all', search: '', sortMode: 'amount-desc' })
    expect(desc.map((t) => t.amount)).toEqual([500, 300, 100])
  })

  it('sorts by date descending by default', () => {
    const r = filterAndSort(txns, { typeFilter: 'all', categoryFilter: 'all', search: '', sortMode: 'date-desc' })
    expect(r.map((t) => t.date)).toEqual(['2020-06-03', '2020-06-02', '2020-06-01'])
  })
})

describe('availableCategories', () => {
  it('prepends "all" to the unique category set', () => {
    const txns = [
      tx({ amount: 1, type: 'expense', category: '식비', date: '2020-06-01' }),
      tx({ amount: 1, type: 'expense', category: '식비', date: '2020-06-02' }),
      tx({ amount: 1, type: 'expense', category: '교통', date: '2020-06-03' }),
    ]
    expect(availableCategories(txns)).toEqual(['all', '식비', '교통'])
  })
})

describe('computeTrend', () => {
  it('buckets "all" mode by year and splits income vs expense', () => {
    const txns = [
      tx({ amount: 1000, type: 'income', date: '2020-03-01' }),
      tx({ amount: 400, type: 'expense', date: '2020-08-01' }),
      tx({ amount: 700, type: 'income', date: '2021-02-01' }),
    ]
    const trend = computeTrend(txns, 'all', new Date('2021-01-01T00:00:00Z'), null)
    expect(trend).toEqual([
      { label: '2020', 수입: 1000, 지출: 400 },
      { label: '2021', 수입: 700, 지출: 0 },
    ])
  })

  it('produces 7 daily buckets in "day" mode', () => {
    const trend = computeTrend([], 'day', new Date('2020-06-15T00:00:00Z'), null)
    expect(trend).toHaveLength(7)
  })
})
