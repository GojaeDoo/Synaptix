import { MapPin, Phone, ExternalLink, CalendarPlus, Check, Route } from 'lucide-react'
import type { Place } from '@/types'
import { formatDistance } from '@/lib/places'
import { CARD_BG, BORDER, ACCENT } from './constants'

interface Props {
  places: Place[]
  isLoading: boolean
  query: string
  addedIds: Set<string>
  onFocus: (place: Place) => void
  onAdd: (place: Place) => void
  onAddToCourse: (place: Place) => void
}

export function PlaceResultList({ places, isLoading, query, addedIds, onFocus, onAdd, onAddToCourse }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2 p-4" style={{ borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none' }}>
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-3 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (!query.trim()) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <MapPin size={26} className="mx-auto mb-2 text-[#48484A]" />
        <p className="text-[13px] text-[#8E8E93]">검색어를 입력해 장소를 찾아보세요</p>
        <p className="text-[11.5px] text-[#636366] mt-1">예: “강남 파스타”, “데이트 코스”, “브런치”</p>
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <p className="text-[13px] text-[#8E8E93]">‘{query}’에 대한 결과가 없어요</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      {places.map((p, i) => {
        const added = addedIds.has(p.id)
        const dist = formatDistance(p.distance)
        return (
          <div
            key={p.id}
            className="flex items-start gap-3 p-4 transition-colors"
            style={{ borderBottom: i < places.length - 1 ? `1px solid ${BORDER}` : 'none' }}
          >
            <button
              onClick={() => onFocus(p)}
              className="flex-1 min-w-0 text-left cursor-pointer group"
              title="지도에서 보기"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-medium text-[#F2F2F7] group-hover:text-white truncate">{p.name}</span>
                {p.category && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ color: ACCENT, background: 'rgba(0,200,150,0.1)' }}>
                    {p.category}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#8E8E93] mt-1 truncate flex items-center gap-1">
                <MapPin size={11} className="shrink-0 text-[#636366]" />
                {p.address}
                {dist && <span className="text-[#636366]">· {dist}</span>}
              </p>
              {p.phone && (
                <p className="text-[11.5px] text-[#636366] mt-0.5 flex items-center gap-1">
                  <Phone size={10} className="shrink-0" />
                  {p.phone}
                </p>
              )}
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="카카오맵에서 열기"
                  aria-label={`${p.name} 카카오맵에서 열기`}
                >
                  <ExternalLink size={14} />
                </a>
              )}
              <button
                onClick={() => onAddToCourse(p)}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer text-[#AEAEB2] hover:text-white bg-white/[0.05] hover:bg-white/[0.1]"
                title="이 장소를 코스(동선)에 추가"
              >
                <Route size={13} />
                코스
              </button>
              <button
                onClick={() => onAdd(p)}
                disabled={added}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer disabled:cursor-default"
                style={
                  added
                    ? { color: ACCENT, background: 'rgba(0,200,150,0.12)' }
                    : { color: '#0F0F0F', background: ACCENT }
                }
                title="이 장소를 일정에 추가"
              >
                {added ? <Check size={13} /> : <CalendarPlus size={13} />}
                {added ? '추가됨' : '일정'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
