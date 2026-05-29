import { MapPin, ExternalLink } from 'lucide-react'
import type { CourseStop } from '@/types'
import { formatTimeRange } from '@/lib/course'
import { CARD_BG, BORDER, ACCENT } from './constants'

// 읽기전용 타임라인 — 공유받은 코스 뷰에서 동선을 순서대로 보여준다.
export function CourseTimeline({ stops }: { stops: CourseStop[] }) {
  return (
    <ol className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      {stops.map((stop, i) => (
        <li
          key={stop.id}
          className="flex items-start gap-3 p-4"
          style={{ borderBottom: i < stops.length - 1 ? `1px solid ${BORDER}` : 'none' }}
        >
          <span
            className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: 'rgba(0,200,150,0.15)', color: ACCENT }}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold" style={{ color: ACCENT }}>
                {formatTimeRange(stop)}
              </span>
              {stop.memo && (
                <span className="text-[11px] px-1.5 py-0.5 rounded text-[#AEAEB2] bg-white/[0.06]">{stop.memo}</span>
              )}
            </div>
            <p className="text-[14px] font-medium text-[#F2F2F7] mt-1 truncate">{stop.location.name}</p>
            <p className="text-[12px] text-[#8E8E93] truncate flex items-center gap-1">
              <MapPin size={11} className="shrink-0 text-[#636366]" />
              {stop.location.address}
            </p>
          </div>
          {stop.location.url && (
            <a
              href={stop.location.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
              title="카카오맵에서 열기"
              aria-label={`${stop.location.name} 카카오맵에서 열기`}
            >
              <ExternalLink size={14} />
            </a>
          )}
        </li>
      ))}
    </ol>
  )
}
