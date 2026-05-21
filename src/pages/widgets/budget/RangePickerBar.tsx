import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon } from 'lucide-react'
import type { BudgetRange } from '@/hooks/useBudgetRange'
import { CARD_BG, BORDER } from './constants'

// 기간 표시 + 좌우 네비 + 달력 팝오버 트리거.
export function RangePickerBar({ range }: { range: BudgetRange }) {
  const { rangeMode, label, span, hasNavButtons, goPrev, goNext, openPopover } = range
  return (
    <div className="flex items-center gap-2 mb-5">
      {hasNavButtons && (
        <button
          onClick={goPrev}
          className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-colors cursor-pointer"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: '#8E8E93' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F7')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8E8E93')}
          aria-label="이전"
        >
          <ChevronLeft size={15} />
        </button>
      )}
      <button
        onClick={openPopover}
        className="flex items-center justify-between gap-3 flex-1 h-9 px-3.5 rounded-xl transition-colors cursor-pointer"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#222222')}
        onMouseLeave={(e) => (e.currentTarget.style.background = CARD_BG)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon size={14} style={{ color: '#3182F6' }} />
          <p
            className="text-[13.5px] font-semibold tracking-tight truncate"
            style={{ color: '#F2F2F7' }}
          >
            {label}
          </p>
          {span && rangeMode !== 'day' && rangeMode !== 'all' && rangeMode !== 'custom' && (
            <p className="hidden sm:block text-[11.5px]" style={{ color: '#636366' }}>
              · {span}
            </p>
          )}
        </div>
        <ChevronDown size={14} style={{ color: '#8E8E93' }} />
      </button>
      {hasNavButtons && (
        <button
          onClick={goNext}
          className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-colors cursor-pointer"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: '#8E8E93' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F7')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8E8E93')}
          aria-label="다음"
        >
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  )
}
