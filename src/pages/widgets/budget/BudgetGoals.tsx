import { useState } from 'react'
import { Pencil, Check, X, Target } from 'lucide-react'
import { formatKRW } from '@/lib/utils'
import { CARD_BG, BORDER, CAT_COLOR, EXP_CATS } from './constants'

interface Props {
  spending: Record<string, number>   // 카테고리별 현재 지출 합계
  goals: Record<string, number>      // 카테고리별 예산 목표
  onSetGoal: (category: string, amount: number) => void
  onRemoveGoal: (category: string) => void
}

interface RowProps {
  category: string
  spent: number
  goal: number | undefined
  onSetGoal: (amount: number) => void
  onRemoveGoal: () => void
}

function GoalRow({ category, spent, goal, onSetGoal, onRemoveGoal }: RowProps) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(goal != null ? String(goal) : '')

  const color = CAT_COLOR[category] ?? '#8E8E93'
  const pct = goal != null && goal > 0 ? Math.min((spent / goal) * 100, 100) : null
  const over = goal != null && spent > goal

  const commit = () => {
    const v = parseInt(input.replace(/,/g, ''), 10)
    if (!isNaN(v) && v > 0) onSetGoal(v)
    else if (input === '') onRemoveGoal()
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-1.5 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-[13px] font-medium truncate" style={{ color: '#F2F2F7' }}>
            {category}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] tabular-nums" style={{ color: over ? '#FF453A' : '#AEAEB2' }}>
            {formatKRW(spent)}
          </span>
          {goal != null && (
            <span className="text-[11px] text-[#636366]">/ {formatKRW(goal)}</span>
          )}

          {editing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
                placeholder="목표 금액"
                style={{
                  width: 100,
                  height: 26,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  padding: '0 8px',
                  fontSize: 12,
                  color: '#F2F2F7',
                  outline: 'none',
                }}
              />
              <button
                onClick={commit}
                className="w-6 h-6 flex items-center justify-center rounded text-[#05D686] hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-[#636366] hover:text-[#8E8E93] hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setInput(goal != null ? String(goal) : ''); setEditing(true) }}
              className="w-6 h-6 flex items-center justify-center rounded text-[#48484A] hover:text-[#8E8E93] hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="예산 목표 설정"
            >
              <Pencil size={11} />
            </button>
          )}
        </div>
      </div>

      {/* 프로그레스 바 */}
      {pct != null ? (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: over
                ? '#FF453A'
                : pct >= 80
                  ? '#FFB74D'
                  : color,
            }}
          />
        </div>
      ) : (
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="h-full w-0" />
        </div>
      )}

      {/* 초과/달성률 텍스트 */}
      {goal != null && (
        <p className="text-[11px]" style={{ color: over ? '#FF453A' : '#636366' }}>
          {over
            ? `${formatKRW(spent - goal)} 초과`
            : `${formatKRW(goal - spent)} 남음 (${Math.round(pct ?? 0)}%)`}
        </p>
      )}
    </div>
  )
}

export function BudgetGoals({ spending, goals, onSetGoal, onRemoveGoal }: Props) {
  // 지출이 있거나 목표가 설정된 카테고리만 표시
  const activeCategories = EXP_CATS.filter((c) => (spending[c] ?? 0) > 0 || goals[c] != null)

  if (activeCategories.length === 0) return null

  return (
    <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <Target size={14} style={{ color: '#3182F6' }} />
        <p className="text-[13px] font-semibold" style={{ color: '#F2F2F7' }}>카테고리별 예산</p>
        <p className="text-[11px] ml-auto" style={{ color: '#636366' }}>✏️ 아이콘으로 목표 설정</p>
      </div>
      <div className="px-5">
        {activeCategories.map((cat) => (
          <GoalRow
            key={cat}
            category={cat}
            spent={spending[cat] ?? 0}
            goal={goals[cat]}
            onSetGoal={(amt) => onSetGoal(cat, amt)}
            onRemoveGoal={() => onRemoveGoal(cat)}
          />
        ))}
      </div>
    </div>
  )
}
