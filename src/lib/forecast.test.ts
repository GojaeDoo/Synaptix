import { describe, it, expect } from 'vitest'
import { aggregateDaily, nextDays } from './forecast'
import type { ForecastSlot } from '@/types'

// 테스트는 TZ=UTC로 실행된다(package.json). 그래야 일별 그룹핑과 정오 슬롯 선택이 결정적.
function slot(iso: string, over: Partial<ForecastSlot> = {}): ForecastSlot {
  return {
    ts: Math.floor(Date.parse(iso) / 1000),
    temp: 20,
    feelsLike: 20,
    description: 'clear',
    icon: '01d',
    code: 800,
    pop: 0,
    humidity: 50,
    windSpeed: 1,
    ...over,
  }
}

// "오늘"과 절대 겹치지 않도록 과거 연도를 쓴다 (nextDays가 오늘을 제외하므로).
const slots: ForecastSlot[] = [
  slot('2020-01-01T03:00:00Z', { temp: 10, pop: 0.1 }),
  slot('2020-01-01T12:00:00Z', { temp: 20, pop: 0.2, icon: '10d', description: 'rain' }),
  slot('2020-01-01T21:00:00Z', { temp: 12, pop: 0.0 }),
  slot('2020-01-02T12:00:00Z', { temp: 25, pop: 0.3 }),
]

describe('aggregateDaily', () => {
  it('groups slots by calendar day', () => {
    expect(aggregateDaily(slots)).toHaveLength(2)
  })

  it('computes daily high/low and max precipitation probability', () => {
    const [day1] = aggregateDaily(slots)
    expect(day1.high).toBe(20)
    expect(day1.low).toBe(10)
    expect(day1.pop).toBeCloseTo(0.2)
  })

  it('picks the icon/description from the midday (11–14h) slot', () => {
    const [day1] = aggregateDaily(slots)
    expect(day1.icon).toBe('10d')
    expect(day1.description).toBe('rain')
  })

  it('falls back to the middle slot when no midday slot exists', () => {
    const evening = [
      slot('2020-01-03T18:00:00Z', { icon: 'A' }),
      slot('2020-01-03T21:00:00Z', { icon: 'B' }),
      slot('2020-01-03T23:00:00Z', { icon: 'C' }),
    ]
    // length 3 → 가운데 인덱스 1
    expect(aggregateDaily(evening)[0].icon).toBe('B')
  })
})

describe('nextDays', () => {
  it('returns at most `count` days', () => {
    expect(nextDays(slots, 1)).toHaveLength(1)
    expect(nextDays(slots, 5)).toHaveLength(2)
  })
})
