import { useState } from 'react'
import { Route, Trash2, ArrowUp, ArrowDown, MapPin, Clock, Share2, Check } from 'lucide-react'
import { useCourseStore } from '@/store/courseStore'
import { courseSpan, encodeCourse } from '@/lib/course'
import { CARD_BG, BORDER, ACCENT, fieldStyle } from './constants'

const timeFieldStyle = { ...fieldStyle, height: 32, width: 96, padding: '0 6px', fontSize: 13 }

export function CoursePanel() {
  const [copied, setCopied] = useState(false)
  const title = useCourseStore((s) => s.title)
  const date = useCourseStore((s) => s.date)
  const stops = useCourseStore((s) => s.stops)
  const setTitle = useCourseStore((s) => s.setTitle)
  const setDate = useCourseStore((s) => s.setDate)
  const updateStop = useCourseStore((s) => s.updateStop)
  const removeStop = useCourseStore((s) => s.removeStop)
  const reorderStops = useCourseStore((s) => s.reorderStops)
  const clear = useCourseStore((s) => s.clear)

  const span = courseSpan({ title, date, stops })

  const onShare = async () => {
    const encoded = encodeCourse({ title, date, stops })
    if (!encoded) return
    const url = `${window.location.origin}/course?d=${encoded}`
    const shareData = { title: `${title} — Synaptix 코스`, text: `${title} (${stops.length}곳)`, url }
    // 모바일은 네이티브 공유 시트(카톡 등), 데스크톱은 링크 복사로 폴백.
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // 사용자가 취소했거나 미지원 → 복사 폴백으로 진행
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('이 링크를 복사해 공유하세요', url)
    }
  }

  return (
    <section className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 p-4 flex-wrap" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 min-w-0">
          <Route size={16} style={{ color: ACCENT }} className="shrink-0" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="코스 제목"
            className="bg-transparent text-[15px] font-semibold text-[#F2F2F7] outline-none min-w-0 w-40"
            placeholder="코스 제목"
          />
          <span className="text-[12px] text-[#8E8E93] shrink-0">
            {stops.length}곳{span ? ` · ${span.start}–${span.end}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="date"
            value={date ?? ''}
            onChange={(e) => setDate(e.target.value || null)}
            aria-label="코스 날짜"
            style={{ ...fieldStyle, height: 32, width: 150, fontSize: 13 }}
          />
          {stops.length > 0 && (
            <>
              <button
                onClick={onShare}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
                style={copied ? { color: ACCENT, background: 'rgba(0,200,150,0.12)' } : { color: '#0F0F0F', background: ACCENT }}
                title="코스를 링크로 공유"
              >
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                {copied ? '복사됨' : '공유'}
              </button>
              <button
                onClick={clear}
                className="h-8 px-2.5 rounded-lg text-[12px] text-[#8E8E93] hover:text-white bg-white/[0.05] hover:bg-white/[0.1] transition-colors cursor-pointer"
              >
                비우기
              </button>
            </>
          )}
        </div>
      </div>

      {/* 빈 상태 */}
      {stops.length === 0 ? (
        <div className="p-8 text-center">
          <Route size={26} className="mx-auto mb-2 text-[#48484A]" />
          <p className="text-[13px] text-[#8E8E93]">검색 결과에서 <span style={{ color: ACCENT }}>“코스”</span>를 눌러 동선을 만들어보세요</p>
          <p className="text-[11.5px] text-[#636366] mt-1">예: 14:00 카페 → 16:00 산책 → 18:00 저녁</p>
        </div>
      ) : (
        <ol>
          {stops.map((stop, i) => (
            <li
              key={stop.id}
              className="flex items-start gap-3 p-4"
              style={{ borderBottom: i < stops.length - 1 ? `1px solid ${BORDER}` : 'none' }}
            >
              {/* 순서 번호 */}
              <span
                className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-bold"
                style={{ background: 'rgba(0,200,150,0.15)', color: ACCENT }}
              >
                {i + 1}
              </span>

              <div className="flex-1 min-w-0 flex flex-col gap-2">
                {/* 장소명 + 주소 */}
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#F2F2F7] truncate">{stop.location.name}</p>
                  <p className="text-[12px] text-[#8E8E93] truncate flex items-center gap-1">
                    <MapPin size={11} className="shrink-0 text-[#636366]" />
                    {stop.location.address}
                  </p>
                </div>

                {/* 시간 + 메모 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Clock size={13} className="text-[#636366] shrink-0" />
                  <input
                    type="time"
                    value={stop.startTime}
                    onChange={(e) => updateStop(stop.id, { startTime: e.target.value })}
                    aria-label="시작 시간"
                    style={timeFieldStyle}
                  />
                  <span className="text-[#636366]">–</span>
                  <input
                    type="time"
                    value={stop.endTime}
                    onChange={(e) => updateStop(stop.id, { endTime: e.target.value })}
                    aria-label="종료 시간"
                    style={timeFieldStyle}
                  />
                  <input
                    value={stop.memo}
                    onChange={(e) => updateStop(stop.id, { memo: e.target.value })}
                    placeholder="메모 (예: 데이트, 식사)"
                    aria-label="메모"
                    style={{ ...fieldStyle, height: 32, flex: 1, minWidth: 120, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* 순서 변경 / 삭제 */}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <button
                  onClick={() => reorderStops(i, i - 1)}
                  disabled={i === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  aria-label="위로"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => reorderStops(i, i + 1)}
                  disabled={i === stops.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  aria-label="아래로"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => removeStop(stop.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E8E93] hover:text-[#FF453A] hover:bg-white/[0.06] transition-colors cursor-pointer"
                  aria-label="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
