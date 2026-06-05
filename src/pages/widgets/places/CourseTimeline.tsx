import { MapPin, ExternalLink, Clock } from 'lucide-react'
import type { CourseStop } from '@/types'
import { timeToMinutes } from '@/lib/course'
import { CARD_BG, BORDER, ACCENT } from './constants'

function formatDuration(from: CourseStop, to: CourseStop): string {
  const gap = timeToMinutes(to.startTime) - timeToMinutes(from.endTime)
  if (gap <= 0) return ''
  if (gap < 60) return `${gap}분 이동`
  const h = Math.floor(gap / 60)
  const m = gap % 60
  return m > 0 ? `${h}시간 ${m}분 이동` : `${h}시간 이동`
}

function stopDuration(stop: CourseStop): string {
  const mins = timeToMinutes(stop.endTime) - timeToMinutes(stop.startTime)
  if (mins <= 0) return ''
  if (mins < 60) return `${mins}분`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
}

export function CourseTimeline({ stops }: { stops: CourseStop[] }) {
  return (
    <ol className="relative">
      {stops.map((stop, i) => {
        const isLast = i === stops.length - 1
        const duration = stopDuration(stop)
        const transit = !isLast ? formatDuration(stop, stops[i + 1]) : ''

        return (
          <li key={stop.id} className="flex gap-4">
            {/* 왼쪽: 시간 축 */}
            <div className="flex flex-col items-center" style={{ width: 56, flexShrink: 0 }}>
              <span
                className="text-[12px] font-semibold tabular-nums leading-none mt-1"
                style={{ color: ACCENT }}
              >
                {stop.startTime}
              </span>
              {/* 점 */}
              <div
                className="mt-1.5 w-2.5 h-2.5 rounded-full border-2 shrink-0"
                style={{ borderColor: ACCENT, background: CARD_BG }}
              />
              {/* 세로선 */}
              {!isLast && (
                <div
                  className="flex-1 w-px mt-1"
                  style={{ background: `linear-gradient(to bottom, ${ACCENT}55, ${BORDER})`, minHeight: 32 }}
                />
              )}
            </div>

            {/* 오른쪽: 장소 카드 + 이동 시간 */}
            <div className="flex-1 min-w-0 pb-1">
              {/* 장소 카드 */}
              <div
                className="rounded-xl p-3 mb-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[#F2F2F7] truncate">{stop.location.name}</p>
                    <p className="text-[12px] text-[#8E8E93] truncate flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="shrink-0 text-[#636366]" />
                      {stop.location.address}
                    </p>
                  </div>
                  {stop.location.url && (
                    <a
                      href={stop.location.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-[#636366] hover:text-white hover:bg-white/[0.08] transition-colors"
                      title="카카오맵에서 열기"
                      aria-label={`${stop.location.name} 카카오맵에서 열기`}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                {/* 시간 + 메모 배지 */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,200,150,0.1)', color: ACCENT }}
                  >
                    <Clock size={10} />
                    {stop.startTime}–{stop.endTime}
                    {duration && ` (${duration})`}
                  </span>
                  {stop.memo && (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full text-[#AEAEB2]"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      {stop.memo}
                    </span>
                  )}
                </div>
              </div>

              {/* 이동 시간 표시 */}
              {transit && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="h-px flex-1" style={{ background: BORDER }} />
                  <span className="text-[11px] text-[#636366] shrink-0">{transit}</span>
                  <div className="h-px flex-1" style={{ background: BORDER }} />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
