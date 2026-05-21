import { format, fromUnixTime } from 'date-fns'
import { CloudRain } from 'lucide-react'
import { iconUrl, formatDayLabel } from '@/lib/weather'
import type { DailyAggregate } from '@/lib/forecast'
import { CARD_BG, BORDER } from './constants'

interface Props {
  daily: DailyAggregate[]
  isLoading: boolean
}

// 5일 예보 목록 — 오늘 강조 + 강수확률 + 최저/최고.
export function DailyForecast({ daily, isLoading }: Props) {
  const todayKey = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <p className="text-[13px] font-medium" style={{ color: '#F2F2F7' }}>
          5일 예보
        </p>
      </div>
      {isLoading ? (
        <div className="p-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      ) : daily.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[12px]" style={{ color: '#636366' }}>예보 데이터를 불러올 수 없습니다</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: BORDER }}>
          {daily.map((d) => {
            const isToday = format(fromUnixTime(d.ts), 'yyyy-MM-dd') === todayKey
            return (
              <div key={d.ts} className="flex items-center gap-3 px-5 py-3.5" style={{ borderColor: BORDER }}>
                <p
                  className="w-20 sm:w-24 text-[13px] font-medium shrink-0"
                  style={{ color: isToday ? '#60A5FA' : '#F2F2F7' }}
                >
                  {formatDayLabel(d.ts, isToday)}
                </p>
                <img src={iconUrl(d.icon)} alt={d.description} width={36} height={36} className="shrink-0 select-none" />
                <p className="flex-1 text-[12px] truncate capitalize" style={{ color: '#8E8E93' }}>
                  {d.description}
                </p>
                {d.pop > 0.1 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <CloudRain size={11} style={{ color: '#60A5FA' }} />
                    <span className="text-[11px] tabular-nums" style={{ color: '#60A5FA' }}>
                      {Math.round(d.pop * 100)}%
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 shrink-0 tabular-nums">
                  <span className="text-[14px]" style={{ color: '#636366' }}>
                    {d.low}°
                  </span>
                  <span className="text-[14px] font-semibold" style={{ color: '#F2F2F7' }}>
                    {d.high}°
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
