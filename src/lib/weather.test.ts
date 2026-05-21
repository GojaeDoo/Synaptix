import { describe, it, expect } from 'vitest'
import { iconUrl, formatTime, formatHour, formatDayLabel, hourlySlots, dailyAggregates } from './weather'
import type { ForecastData, ForecastSlot } from '@/types'

// TZ=UTC 로 실행(package.json) — 시각 포맷이 결정적.
function slot(over: Partial<ForecastSlot> & Pick<ForecastSlot, 'ts'>): ForecastSlot {
  return {
    temp: over.temp ?? 20,
    feelsLike: over.feelsLike ?? 20,
    description: over.description ?? 'clear',
    icon: over.icon ?? '01d',
    code: over.code ?? 800,
    pop: over.pop ?? 0,
    humidity: over.humidity ?? 50,
    windSpeed: over.windSpeed ?? 1,
    ...over,
  }
}

describe('iconUrl', () => {
  it('builds the OpenWeatherMap @2x url', () => {
    expect(iconUrl('01d')).toBe('https://openweathermap.org/img/wn/01d@2x.png')
  })
})

describe('time formatters', () => {
  // 2020-06-15T09:30:00Z → 09:30 UTC
  const ts = Math.floor(Date.UTC(2020, 5, 15, 9, 30) / 1000)

  it('formats HH:mm and HH시', () => {
    expect(formatTime(ts)).toBe('09:30')
    expect(formatHour(ts)).toBe('09시')
  })

  it('labels today vs other days', () => {
    expect(formatDayLabel(ts, true)).toBe('오늘')
    expect(formatDayLabel(ts, false)).toMatch(/6\/15/)
  })
})

describe('hourlySlots / dailyAggregates', () => {
  const forecast: ForecastData = {
    city: 'Seoul',
    slots: Array.from({ length: 16 }, (_, i) => slot({ ts: Math.floor(Date.UTC(2020, 5, 15) / 1000) + i * 3 * 3600 })),
  }

  it('takes the first 8 slots for the hourly view', () => {
    expect(hourlySlots(forecast)).toHaveLength(8)
    expect(hourlySlots(undefined)).toEqual([])
  })

  it('caps the daily summary at 5 days', () => {
    expect(dailyAggregates(forecast).length).toBeLessThanOrEqual(5)
    expect(dailyAggregates(undefined)).toEqual([])
  })
})
