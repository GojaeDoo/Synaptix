import { format, fromUnixTime } from 'date-fns'
import type { ForecastSlot } from '@/types'

export interface DailyAggregate {
  ts: number
  high: number
  low: number
  icon: string
  description: string
  pop: number
}

// OpenWeatherMap 5일/3시간 예보를 일별 요약으로 집계.
// 대표 아이콘은 정오 근처(11~14시) 슬롯에서 뽑고, 없으면 가운데 슬롯 사용.
export function aggregateDaily(slots: ForecastSlot[]): DailyAggregate[] {
  const byDay = new Map<string, ForecastSlot[]>()
  for (const s of slots) {
    const key = format(fromUnixTime(s.ts), 'yyyy-MM-dd')
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(s)
  }
  return Array.from(byDay.values()).map((daySlots) => {
    const temps = daySlots.map((s) => s.temp)
    const noonSlot =
      daySlots.find((s) => {
        const h = fromUnixTime(s.ts).getHours()
        return h >= 11 && h <= 14
      }) ?? daySlots[Math.floor(daySlots.length / 2)]
    return {
      ts: daySlots[0].ts,
      high: Math.max(...temps),
      low: Math.min(...temps),
      icon: noonSlot.icon,
      description: noonSlot.description,
      pop: Math.max(...daySlots.map((s) => s.pop)),
    }
  })
}

// 오늘을 제외한 다음 N일의 요약 (위젯에서 사용)
export function nextDays(slots: ForecastSlot[], count: number): DailyAggregate[] {
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  return aggregateDaily(slots)
    .filter((d) => format(fromUnixTime(d.ts), 'yyyy-MM-dd') !== todayKey)
    .slice(0, count)
}
