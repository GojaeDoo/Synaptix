import { Flag, CircleDashed, CircleCheck } from 'lucide-react'
import type { TodoCounts } from '@/lib/todos'
import { CARD_BG, BORDER } from './constants'

interface Props {
  counts: TodoCounts
  overdue: number
}

// 전체 · 진행 중 · 완료 · 기한 지남 4-카드.
export function StatCards({ counts, overdue }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
      {[
        { label: '전체', value: counts.total, color: '#F2F2F7', icon: <Flag size={14} /> },
        { label: '진행 중', value: counts.pending, color: '#3182F6', icon: <CircleDashed size={14} /> },
        { label: '완료', value: counts.done, color: '#05D686', icon: <CircleCheck size={14} /> },
        { label: '기한 지남', value: overdue, color: overdue > 0 ? '#FF453A' : '#636366', icon: <Flag size={14} /> },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-xl sm:rounded-2xl p-2.5 sm:p-4"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2" style={{ color: s.color }}>
            <span className="hidden sm:inline-flex">{s.icon}</span>
            <p className="text-[10.5px] sm:text-[11px] font-medium whitespace-nowrap" style={{ color: '#8E8E93' }}>{s.label}</p>
          </div>
          <p className="text-[18px] sm:text-[22px] font-semibold tabular-nums" style={{ color: s.color }}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}
