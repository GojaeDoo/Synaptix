import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatKRW, formatUSD, timeAgo } from './utils'

describe('formatKRW', () => {
  it('renders won with no decimals and grouping', () => {
    expect(formatKRW(1_800_000)).toBe('₩1,800,000')
    expect(formatKRW(0)).toBe('₩0')
  })

  it('rounds away fractional won', () => {
    expect(formatKRW(12_345.67)).toBe('₩12,346')
  })
})

describe('formatUSD', () => {
  it('renders dollars with exactly two decimals', () => {
    expect(formatUSD(1234.5)).toBe('$1,234.50')
    expect(formatUSD(0)).toBe('$0.00')
  })
})

describe('timeAgo', () => {
  afterEach(() => vi.useRealTimers())

  function freezeNow(iso: string) {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(iso))
  }

  it('says "방금 전" within the last minute', () => {
    freezeNow('2026-05-21T12:00:00Z')
    expect(timeAgo('2026-05-21T11:59:30Z')).toBe('방금 전')
  })

  it('reports minutes under an hour', () => {
    freezeNow('2026-05-21T12:00:00Z')
    expect(timeAgo('2026-05-21T11:25:00Z')).toBe('35분 전')
  })

  it('reports hours under a day', () => {
    freezeNow('2026-05-21T12:00:00Z')
    expect(timeAgo('2026-05-21T09:00:00Z')).toBe('3시간 전')
  })

  it('reports days beyond 24h', () => {
    freezeNow('2026-05-21T12:00:00Z')
    expect(timeAgo('2026-05-18T12:00:00Z')).toBe('3일 전')
  })
})
