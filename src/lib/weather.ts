import { format, fromUnixTime } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ForecastData, ForecastSlot } from '@/types'
import { aggregateDaily, type DailyAggregate } from '@/lib/forecast'

// 날씨 위젯의 표시 포맷/슬롯 선택 로직 — UI/상태와 분리해 단위 테스트가 가능하도록 모았다.
// WeatherDetail과 그 하위 컴포넌트가 공유한다.

export function iconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`
}

export function formatTime(ts: number): string {
  return format(fromUnixTime(ts), 'HH:mm')
}

export function formatHour(ts: number): string {
  return format(fromUnixTime(ts), 'HH시')
}

export function formatDayLabel(ts: number, isToday: boolean): string {
  if (isToday) return '오늘'
  return format(fromUnixTime(ts), 'EEE M/d', { locale: ko })
}

// 앞으로 24시간(3시간 간격) 슬롯.
export function hourlySlots(forecast: ForecastData | undefined): ForecastSlot[] {
  return forecast?.slots.slice(0, 8) ?? []
}

// 다음 5일 일별 요약.
export function dailyAggregates(forecast: ForecastData | undefined): DailyAggregate[] {
  if (!forecast) return []
  return aggregateDaily(forecast.slots).slice(0, 5)
}
