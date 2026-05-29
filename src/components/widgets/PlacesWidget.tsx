import { useState } from 'react'
import { Search, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMyLocation } from '@/hooks/useMyLocation'

const PIXEL = "'Press Start 2P', monospace"
const BG = 'rgba(38, 38, 38, 0.72)'
const BORDER = 'rgba(255,255,255,0.07)'
const ACCENT = '#00C896'


function LocationStat({ myLocation, border }: { myLocation: { lat: number; lng: number } | null; border?: boolean }) {
  const stats = myLocation
    ? [
        { label: 'LAT', value: myLocation.lat.toFixed(3) + '°' },
        { label: 'LNG', value: myLocation.lng.toFixed(3) + '°' },
        { label: 'GPS', value: 'LIVE' },
      ]
    : [
        { label: 'LAT', value: '——' },
        { label: 'LNG', value: '——' },
        { label: 'GPS', value: 'OFF' },
      ]

  return (
    <div
      className="grid grid-cols-3 pt-3"
      style={{ borderTop: border ? `1px solid ${BORDER}` : 'none' }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex flex-col items-center gap-1.5 ${i < 2 ? 'border-r' : ''}`}
          style={{ borderColor: BORDER }}
        >
          <p style={{ fontFamily: PIXEL, fontSize: '6px', color: '#636366', letterSpacing: '0.06em' }}>{s.label}</p>
          <p style={{
            fontFamily: PIXEL, fontSize: '8px', letterSpacing: '0.04em',
            color: s.label === 'GPS'
              ? (myLocation ? ACCENT : '#48484A')
              : (myLocation ? '#F2F2F7' : '#48484A'),
          }}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// 다른 위젯들과 동일한 픽셀 SVG 장식
function PixelPin({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 32 40" style={{ position: 'absolute', imageRendering: 'pixelated', ...style }}>
      <rect x="10" y="2"  width="12" height="3" fill="white" />
      <rect x="6"  y="5"  width="20" height="3" fill="white" />
      <rect x="4"  y="8"  width="24" height="12" fill="white" />
      <rect x="6"  y="20" width="20" height="3" fill="white" />
      <rect x="10" y="23" width="12" height="3" fill="white" />
      <rect x="13" y="26" width="6"  height="4" fill="white" />
      <rect x="13" y="10" width="6"  height="6" fill="#262626" />
    </svg>
  )
}

function PixelPin2({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 32 40" style={{ position: 'absolute', imageRendering: 'pixelated', ...style }}>
      <rect x="10" y="2"  width="12" height="3" fill="white" />
      <rect x="6"  y="5"  width="20" height="3" fill="white" />
      <rect x="4"  y="8"  width="24" height="12" fill="white" />
      <rect x="6"  y="20" width="20" height="3" fill="white" />
      <rect x="10" y="23" width="12" height="3" fill="white" />
      <rect x="13" y="26" width="6"  height="4" fill="white" />
      <rect x="13" y="10" width="6"  height="6" fill="#262626" />
    </svg>
  )
}

export function PlacesWidget() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const myLocation = useMyLocation()

  const go = (q?: string) => {
    const query = (q ?? input).trim()
    navigate(query ? `/widgets/places?q=${encodeURIComponent(query)}` : '/widgets/places')
  }

  const labelBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); navigate('/widgets/places') }}
      className="flex items-center gap-1.5 cursor-pointer group"
      style={{ background: 'transparent' }}
    >
      <span
        className="group-hover:text-white group-hover/card:text-white transition-colors"
        style={{ fontFamily: PIXEL, fontSize: '8px', color: '#8E8E93', letterSpacing: '0.1em' }}
      >
        PLACES
      </span>
      <ArrowUpRight size={11} className="text-[#636366] group-hover:text-white group-hover/card:text-white transition-colors" />
    </button>
  )

  return (
    <div
      id="widget-places"
      onClick={() => navigate('/widgets/places')}
      className="group/card widget-glass h-full rounded-[8px] relative overflow-hidden flex flex-col cursor-pointer"
      style={{ background: BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <PixelPin  style={{ width: 72, height: 90, top: -4, right: 14, opacity: 0.10 }} />
      <PixelPin2 style={{ width: 44, height: 55, top: 28, right: -8, opacity: 0.06 }} />

      {/* ── 모바일 ─────────────────────────────── */}
      <div className="sm:hidden relative z-10 flex flex-col h-full px-5 pt-6 pb-5">
        <div className="flex items-center justify-between mb-5">
          {labelBtn}
        </div>

        {/* 메인 */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          <p style={{ fontFamily: PIXEL, fontSize: '9px', color: '#636366', letterSpacing: '0.06em' }}>
            SEARCH
          </p>
          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); go() }} className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#636366]" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="장소·키워드 검색"
              aria-label="장소 검색"
              style={{ height: 36, width: '100%', paddingLeft: 28, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, color: '#F2F2F7', outline: 'none' }}
            />
          </form>
        </div>

        {/* 푸터 — 위치 스탯 */}
        <LocationStat myLocation={myLocation} border />
      </div>

      {/* ── 데스크톱 ───────────────────────────── */}
      <div className="hidden sm:flex relative z-10 flex-col h-full pl-5 pr-5 pt-[18px] pb-5">
        <div className="flex items-center justify-between">
          {labelBtn}
        </div>

        {/* 메인 */}
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <p style={{ fontFamily: PIXEL, fontSize: '9px', color: '#636366', letterSpacing: '0.06em', marginBottom: 6 }}>
              FIND A PLACE
            </p>
            <p style={{ fontSize: '14px', color: '#8E8E93', lineHeight: 1.5 }}>
              맛집·카페·데이트 코스를<br />
              <span style={{ color: '#F2F2F7' }}>지도에서 바로 검색</span>
            </p>
          </div>

          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); go() }} className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#636366]" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="장소·키워드 검색"
              aria-label="장소 검색"
              style={{ height: 36, width: '100%', paddingLeft: 28, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, color: '#F2F2F7', outline: 'none' }}
            />
          </form>
        </div>

        <div className="flex-1" />

        {/* 푸터 — 위치 스탯 */}
        <LocationStat myLocation={myLocation} border />
      </div>
    </div>
  )
}
