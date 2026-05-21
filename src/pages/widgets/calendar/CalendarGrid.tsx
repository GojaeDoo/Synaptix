import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Todo } from '@/types'
import { CARD_BG, BORDER, PRIORITY_COLOR, DAYS_KO } from './constants'

interface Props {
  month: Date
  setMonth: (d: Date) => void
  selectedDate: string
  setSelectedDate: (iso: string) => void
  todosByDate: Record<string, Todo[]>
}

// 월간 캘린더 — 날짜별 할 일 점 표시, 오늘/선택일 강조.
export function CalendarGrid({ month, setMonth, selectedDate, setSelectedDate, todosByDate }: Props) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const pad = getDay(startOfMonth(month))

  return (
    <div className="rounded-2xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[15px] font-semibold tracking-tight" style={{ color: '#F2F2F7' }}>
          {format(month, 'yyyy년 M월', { locale: ko })}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS_KO.map((d) => (
          <p key={d} className="text-center py-1 text-[10px] tracking-wider" style={{ color: '#636366' }}>
            {d}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd')
          const today = isToday(day)
          const selected = isSameDay(parseISO(selectedDate), day)
          const dayTodos = todosByDate[iso] ?? []
          const hasPending = dayTodos.some((t) => !t.completed)
          return (
            <button
              key={iso}
              onClick={() => setSelectedDate(iso)}
              className="aspect-square flex flex-col items-center justify-center rounded-lg relative transition-colors cursor-pointer"
              style={{
                fontSize: 13,
                background: today
                  ? '#3182F6'
                  : selected
                    ? 'rgba(49,130,246,0.18)'
                    : 'transparent',
                color: today ? '#ffffff' : selected ? '#F2F2F7' : '#AEAEB2',
                fontWeight: today || selected ? 600 : 400,
                border: selected && !today ? '1px solid #3182F6' : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!today && !selected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={(e) => {
                if (!today && !selected) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span>{format(day, 'd')}</span>
              {dayTodos.length > 0 && (
                <div className="flex gap-0.5 absolute" style={{ bottom: 4 }}>
                  {dayTodos.slice(0, 3).map((t, i) => (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: 4,
                        height: 4,
                        background: today
                          ? '#ffffff'
                          : t.completed
                            ? '#48484A'
                            : PRIORITY_COLOR[t.priority],
                        opacity: today ? (hasPending ? 1 : 0.5) : 1,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
