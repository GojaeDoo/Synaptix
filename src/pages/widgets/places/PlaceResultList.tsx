import {
  MapPin, Phone, ExternalLink, CalendarPlus, Check, Route,
  Utensils, Coffee, TreePine, Landmark, ShoppingBag, Heart,
  Dumbbell, Hotel, Building2, Film, Car, Pill,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Place } from '@/types'
import { formatDistance } from '@/lib/places'
import { CARD_BG, BORDER, ACCENT } from './constants'

interface ThumbStyle { icon: React.ElementType; bg: string; color: string }

function getCategoryThumb(category: string): ThumbStyle {
  const c = category.toLowerCase()
  if (c.includes('카페') || c.includes('커피') || c.includes('디저트') || c.includes('베이커리'))
    return { icon: Coffee, bg: '#3D2B1F', color: '#C8956C' }
  if (c.includes('음식') || c.includes('한식') || c.includes('일식') || c.includes('중식') ||
      c.includes('양식') || c.includes('분식') || c.includes('치킨') || c.includes('피자') ||
      c.includes('술집') || c.includes('고기') || c.includes('해산물'))
    return { icon: Utensils, bg: '#2D1F1F', color: '#E07070' }
  if (c.includes('공원') || c.includes('숲') || c.includes('산') || c.includes('자연'))
    return { icon: TreePine, bg: '#1A2D1A', color: '#5CB85C' }
  if (c.includes('관광') || c.includes('명소') || c.includes('문화') || c.includes('박물관') || c.includes('미술관'))
    return { icon: Landmark, bg: '#1F1F2D', color: '#7B7BE8' }
  if (c.includes('쇼핑') || c.includes('마트') || c.includes('편의점') || c.includes('백화점') || c.includes('시장'))
    return { icon: ShoppingBag, bg: '#2D1F2D', color: '#C86CC8' }
  if (c.includes('병원') || c.includes('의원') || c.includes('클리닉'))
    return { icon: Heart, bg: '#2D1A1A', color: '#E05C5C' }
  if (c.includes('약국'))
    return { icon: Pill, bg: '#1A2A2D', color: '#5BC8C8' }
  if (c.includes('스포츠') || c.includes('헬스') || c.includes('피트니스') || c.includes('여가'))
    return { icon: Dumbbell, bg: '#1F2A1F', color: '#7EC87E' }
  if (c.includes('숙박') || c.includes('호텔') || c.includes('모텔') || c.includes('펜션'))
    return { icon: Hotel, bg: '#1F2020', color: '#A0A0B0' }
  if (c.includes('영화') || c.includes('공연') || c.includes('오락'))
    return { icon: Film, bg: '#1F1A2D', color: '#9B7BE8' }
  if (c.includes('주차'))
    return { icon: Car, bg: '#232323', color: '#888888' }
  return { icon: Building2, bg: '#1E2025', color: '#6E8FAD' }
}

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
            {/* 카테고리 썸네일 */}
            {(() => {
              const { icon: Icon, bg, color } = getCategoryThumb(p.category)
              return (
                <div
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: bg }}
                  aria-hidden
                >
                  <Icon size={20} style={{ color }} strokeWidth={1.8} />
                </div>
              )
            })()}
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
                onClick={() => {
                  onAddToCourse(p)
                  toast.success(`${p.name} 코스에 추가됨`, { duration: 2000 })
                }}
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
