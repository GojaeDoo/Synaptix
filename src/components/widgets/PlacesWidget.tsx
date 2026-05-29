import { useState } from 'react'
import { Search, ArrowUpRight, MapPin, CalendarPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SUGGESTIONS } from '@/pages/widgets/places/constants'

const PIXEL = "'Press Start 2P', monospace"
const BG = 'rgba(38, 38, 38, 0.72)'
const BORDER = 'rgba(255,255,255,0.07)'
const ACCENT = '#00C896'

function PixelPin({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 32 40" style={{ position: 'absolute', imageRendering: 'pixelated', ...style }}>
      <rect x="10" y="2"  width="12" height="3" fill="white" />
      <rect x="6"  y="5"  width="20" height="3" fill="white" />
      <rect x="4"  y="8"  width="24" height="12" fill="white" />
      <rect x="6"  y="20" width="20" height="3" fill="white" />
      <rect x="10" y="23" width="12" height="3" fill="white" />
      <rect x="13" y="26" width="6"  height="4" fill="white" />
      {/* 가운데 구멍 */}
      <rect x="13" y="10" width="6" height="6" fill="#262626" />
    </svg>
  )
}

// 대시보드 카드는 검색 API를 직접 부르지 않고, 입력을 PlacesDetail로 넘기는 런처 역할.
// (대시보드 마운트마다 카카오 호출이 발생하는 것을 피한다)
export function PlacesWidget() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')

  const go = (q?: string) => {
    const query = (q ?? input).trim()
    navigate(query ? `/widgets/places?q=${encodeURIComponent(query)}` : '/widgets/places')
  }

  return (
    <div
      id="widget-places"
      onClick={() => navigate('/widgets/places')}
      className="group/card widget-glass h-full rounded-2xl relative overflow-hidden flex flex-col cursor-pointer transition-shadow duration-200 hover:ring-1 hover:ring-white/15"
      style={{ background: BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <PixelPin style={{ width: 80, height: 100, top: -6, right: -4, opacity: 0.13, transform: 'rotate(8deg)' }} />

      {/* header */}
      <div className="flex items-center justify-between gap-2 relative z-10 shrink-0" style={{ padding: '14px 18px 10px' }}>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/widgets/places') }}
          className="flex items-center gap-1.5 cursor-pointer group min-w-0"
          style={{ background: 'transparent' }}
        >
          <span className="truncate group-hover:text-white group-hover/card:text-white transition-colors" style={{ fontFamily: PIXEL, fontSize: '8px', color: '#8E8E93', letterSpacing: '0.1em' }}>
            PLACES
          </span>
          <ArrowUpRight size={11} className="text-[#636366] group-hover:text-white group-hover/card:text-white transition-colors shrink-0" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-3 relative z-10 min-h-0 overflow-y-auto" style={{ padding: '4px 18px 18px', borderTop: `1px solid ${BORDER}` }}>
        <p className="text-[13px] text-[#F2F2F7] leading-snug mt-2 flex items-start gap-1.5">
          <CalendarPlus size={14} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
          맛집·데이트 코스를 찾아 <span className="text-[#8E8E93]">바로 일정에 추가</span>
        </p>

        {/* 검색 입력 — 클릭 전파를 막아 카드 네비게이션과 분리 */}
        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => { e.preventDefault(); go() }}
          className="relative"
        >
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#636366]" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="장소 검색"
            aria-label="장소 검색"
            style={{
              height: 38, width: '100%', paddingLeft: 30, paddingRight: 10,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
              borderRadius: 10, fontSize: 13, color: '#F2F2F7', outline: 'none',
            }}
          />
        </form>

        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {SUGGESTIONS.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => go(s)}
              className="flex items-center gap-1 text-[11.5px] px-2 py-1 rounded-full text-[#AEAEB2] hover:text-white bg-white/[0.05] hover:bg-white/[0.1] transition-colors cursor-pointer"
            >
              <MapPin size={10} className="text-[#636366]" />
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
