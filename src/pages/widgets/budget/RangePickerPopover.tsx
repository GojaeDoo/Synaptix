import { format, subMonths, addMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BudgetRange } from '@/hooks/useBudgetRange'
import { CARD_BG, BORDER } from './constants'

const PRESETS = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: 'year', label: '올해' },
  { key: 'all', label: '전체' },
] as const

// 프리셋 + 월 단위 달력으로 기간(하루 또는 범위)을 선택하는 모달 팝오버.
export function RangePickerPopover({ range }: { range: BudgetRange }) {
  const {
    popoverOpen,
    setPopoverOpen,
    pickerMonth,
    setPickerMonth,
    pickerStart,
    pickerEnd,
    calendarDays,
    isInPickerRange,
    handleDateClick,
    applyPicker,
    applyPreset,
  } = range

  if (!popoverOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => setPopoverOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden fade-up"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* presets */}
        <div className="flex flex-wrap gap-1.5 p-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className="px-3 h-7 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#AEAEB2' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(49,130,246,0.16)'
                e.currentTarget.style.color = '#3182F6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = '#AEAEB2'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* month nav */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <button
            onClick={() => setPickerMonth((m) => subMonths(m, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
            style={{ color: '#8E8E93' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F2F2F7'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8E8E93'
              e.currentTarget.style.background = 'transparent'
            }}
            aria-label="이전 달"
          >
            <ChevronLeft size={15} />
          </button>
          <p className="text-[13.5px] font-semibold tracking-tight" style={{ color: '#F2F2F7' }}>
            {format(pickerMonth, 'yyyy년 M월', { locale: ko })}
          </p>
          <button
            onClick={() => setPickerMonth((m) => addMonths(m, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
            style={{ color: '#8E8E93' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F2F2F7'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8E8E93'
              e.currentTarget.style.background = 'transparent'
            }}
            aria-label="다음 달"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* weekday header */}
        <div className="grid grid-cols-7 gap-1 px-3 pb-1">
          {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
            <div
              key={d}
              className="h-7 flex items-center justify-center text-[11px] font-medium"
              style={{ color: i === 5 ? '#60A5FA' : i === 6 ? '#FF8A80' : '#636366' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* days grid */}
        <div className="grid grid-cols-7 gap-1 px-3 pb-3">
          {calendarDays.map((d) => {
            const inMonth = d.getMonth() === pickerMonth.getMonth()
            const inRange = isInPickerRange(d)
            const isStart = pickerStart && d.toDateString() === pickerStart.toDateString()
            const isEnd = pickerEnd && d.toDateString() === pickerEnd.toDateString()
            const isToday = d.toDateString() === new Date().toDateString()
            const isEdge = isStart || isEnd
            return (
              <button
                key={d.toISOString()}
                onClick={() => handleDateClick(d)}
                className="relative h-9 flex items-center justify-center text-[13px] tabular-nums rounded-lg transition-colors cursor-pointer"
                style={{
                  background: isEdge
                    ? '#3182F6'
                    : inRange
                      ? 'rgba(49,130,246,0.18)'
                      : 'transparent',
                  color: isEdge
                    ? '#ffffff'
                    : !inMonth
                      ? '#3A3A3C'
                      : inRange
                        ? '#F2F2F7'
                        : isToday
                          ? '#3182F6'
                          : '#F2F2F7',
                  fontWeight: isEdge || isToday ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isEdge && !inRange) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (!isEdge && !inRange) e.currentTarget.style.background = 'transparent'
                }}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>

        {/* footer */}
        <div
          className="flex items-center justify-between gap-2 px-3 py-3"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <p className="text-[11.5px]" style={{ color: '#8E8E93' }}>
            {pickerStart
              ? pickerEnd && pickerEnd.toDateString() !== pickerStart.toDateString()
                ? `${format(pickerStart, 'M월 d일')} ~ ${format(pickerEnd, 'M월 d일')}`
                : `${format(pickerStart, 'M월 d일')} (하루)`
              : '날짜를 선택하세요'}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPopoverOpen(false)}
              className="px-3 h-8 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#F2F2F7' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              취소
            </button>
            <button
              onClick={applyPicker}
              disabled={!pickerStart}
              className="px-3 h-8 rounded-lg text-[12px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: '#3182F6', color: '#ffffff' }}
              onMouseEnter={(e) => {
                if (pickerStart) e.currentTarget.style.background = '#5c6ecc'
              }}
              onMouseLeave={(e) => {
                if (pickerStart) e.currentTarget.style.background = '#3182F6'
              }}
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
