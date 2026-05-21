import { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTodos } from '@/hooks/useTodos'
import { useCalendarStore } from '@/store/calendarStore'
import { cn } from '@/lib/utils'

const PIXEL = "'Press Start 2P', monospace"
const BG = 'rgba(38, 38, 38, 0.72)'
const BORDER = 'rgba(255,255,255,0.07)'
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

function PixelGrid({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 52 44" style={{ position: 'absolute', imageRendering: 'pixelated', ...style }}>
      {[0, 1, 2, 3].flatMap((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <rect key={`${row}-${col}`} x={col * 13} y={row * 13} width={4} height={4} fill="white" />
        ))
      )}
    </svg>
  )
}

export function CalendarWidget() {
  const navigate = useNavigate()
  const month = useCalendarStore((s) => s.month)
  const setMonth = useCalendarStore((s) => s.setMonth)
  const selectedDate = useCalendarStore((s) => s.selectedDate)
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate)
  const [newTodo, setNewTodo] = useState('')
  const { data: todos = [], isLoading, addTodo, toggleTodo, deleteTodo } = useTodos()

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const pad = getDay(startOfMonth(month))

  const todosByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of todos) {
      if (t.due_date && !t.completed) map[t.due_date] = (map[t.due_date] ?? 0) + 1
    }
    return map
  }, [todos])

  const visibleTodos = useMemo(
    () => todos.filter((t) => t.due_date === selectedDate),
    [todos, selectedDate]
  )

  const handleAdd = () => {
    if (!newTodo.trim()) return
    addTodo.mutate({ title: newTodo.trim(), completed: false, due_date: selectedDate, priority: 'medium' })
    setNewTodo('')
  }

  const pending = todos.filter((t) => !t.completed)
  const done = todos.filter((t) => t.completed)

  return (
    <div id="widget-calendar" className="group/card widget-glass h-full rounded-2xl relative overflow-hidden flex flex-col" style={{ background: BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <PixelGrid style={{ width: 72, height: 60, top: -6, right: 14, opacity: 0.06 }} />

      {/* mobile */}
      <div className="flex flex-col h-full sm:hidden relative z-10" style={{ padding: '24px 20px 20px' }}>
        {/* label row */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate('/widgets/calendar')}
            className="flex items-center gap-1.5 cursor-pointer group -ml-1.5 px-1.5 py-1 rounded-md hover:bg-white/[0.06] transition-colors"
            style={{ background: 'transparent' }}
            aria-label="할 일 상세 페이지로 이동"
          >
            <span style={{ fontFamily: PIXEL, fontSize: '8px', color: '#8E8E93', letterSpacing: '0.1em' }} className="group-hover:text-white group-hover/card:text-white transition-colors">
              TODO
            </span>
            <ArrowUpRight size={13} className="text-[#8E8E93] group-hover:text-white group-hover/card:text-white transition-colors" />
          </button>
          <p style={{ fontFamily: PIXEL, fontSize: '7px', color: '#636366' }}>
            {format(new Date(), 'M월 d일', { locale: ko })}
          </p>
        </div>

        {/* main: count */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading ? (
            <div className="skeleton h-14 w-16 rounded-xl" />
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <p style={{ fontSize: '48px', fontWeight: 700, color: '#F2F2F7', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {pending.length}
                </p>
                <p style={{ fontSize: '15px', color: '#8E8E93', whiteSpace: 'nowrap' }}>개 남음</p>
              </div>
              <p style={{ fontSize: '13px', color: '#636366', marginTop: 8, whiteSpace: 'nowrap' }}>
                {pending.length === 0 ? '모두 완료! ✓' : `완료 ${done.length}개`}
              </p>
            </>
          )}
        </div>

        {/* footer: todo preview */}
        <div className="space-y-2.5 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          {pending.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#636366' }}>할 일이 없어요 ✓</p>
          ) : (
            pending.slice(0, 2).map((todo) => (
              <div key={todo.id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#3182F6' }} />
                <p className="truncate" style={{ fontSize: '13px', color: '#8E8E93' }}>{todo.title}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* desktop */}
      <div className="hidden sm:flex flex-col h-full relative z-10">
        {/* month nav */}
        <div className="flex items-center justify-between" style={{ padding: '18px 20px 14px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F2F2F7' }}>
              {format(month, 'M월', { locale: ko })}
            </p>
            <p style={{ fontFamily: PIXEL, fontSize: '7px', color: '#636366', marginTop: 4 }}>
              {format(month, 'yyyy', { locale: ko })}
              {pending.length > 0 && ` · ${pending.length}개`}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            {[
              { icon: <ChevronLeft size={13} aria-hidden="true" />, onClick: () => setMonth(subMonths(month, 1)), label: '이전 달' },
              { icon: <ChevronRight size={13} aria-hidden="true" />, onClick: () => setMonth(addMonths(month, 1)), label: '다음 달' },
            ].map(({ icon, onClick, label }) => (
              <button key={label} onClick={onClick} aria-label={label}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                style={{ color: '#636366' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#F2F2F7'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#636366'; e.currentTarget.style.background = 'transparent' }}>
                {icon}
              </button>
            ))}
            <button
              onClick={() => navigate('/widgets/calendar')}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ml-1 text-[#8E8E93] hover:text-white hover:bg-white/[0.07] group-hover/card:text-white"
              aria-label="할 일 상세"
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* calendar grid */}
        <div style={{ padding: '0 16px' }}>
          <div className="grid grid-cols-7 mb-1">
            {DAYS_KO.map((d) => (
              <p key={d} className="text-center py-1" style={{ fontFamily: PIXEL, fontSize: '8px', color: '#8E8E93' }}>{d}</p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}
            {days.map((day) => {
              const iso = format(day, 'yyyy-MM-dd')
              const today = isToday(day)
              const selected = selectedDate === iso
              const count = todosByDate[iso] ?? 0
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(iso)}
                  className="aspect-square flex flex-col items-center justify-center rounded-lg transition-colors relative cursor-pointer"
                  style={{
                    fontSize: '12px',
                    background: today ? '#3182F6' : (selected ? 'rgba(49,130,246,0.18)' : 'transparent'),
                    color: today ? '#ffffff' : (selected ? '#F2F2F7' : '#8E8E93'),
                    fontWeight: today || selected ? 600 : 400,
                    border: selected && !today ? '1px solid #3182F6' : '1px solid transparent',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => { if (!today && !selected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={(e) => { if (!today && !selected) e.currentTarget.style.background = 'transparent' }}
                >
                  <span>{format(day, 'd')}</span>
                  {count > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: today ? '#ffffff' : '#3182F6',
                      }}
                      title={`${count}개 할일`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ height: 1, background: BORDER, margin: '12px 16px' }} />

        {/* selected date label */}
        <div className="flex items-center justify-between" style={{ padding: '0 16px', marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: '#8E8E93' }}>
            {format(new Date(selectedDate), 'M월 d일 (E)', { locale: ko })}
            <span style={{ color: '#636366', marginLeft: 6 }}>· {visibleTodos.length}개</span>
          </p>
        </div>

        {/* add todo */}
        <div className="flex items-center gap-2" style={{ padding: '0 16px', marginBottom: 10 }}>
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`${format(new Date(selectedDate), 'M/d')}에 할일 추가...`}
            aria-label={`${format(new Date(selectedDate), 'M월 d일')} 할일 추가`}
            className="flex-1 h-8 focus:outline-none"
            style={{ background: 'transparent', fontSize: '12px', color: '#AEAEB2' }}
          />
          <button onClick={handleAdd}
            aria-label="할일 추가"
            className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#8E8E93' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#F2F2F7' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#8E8E93' }}>
            <Plus size={12} aria-hidden="true" />
          </button>
        </div>

        {/* todos */}
        <div className="flex-1 overflow-y-auto pb-4 space-y-0.5" style={{ padding: '0 12px 16px' }}>
          {visibleTodos.map((todo) => (
            <div key={todo.id}
              className={cn('flex items-center gap-2.5 px-2 py-2 rounded-xl group transition-colors', todo.completed && 'opacity-40')}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <button
                onClick={() => toggleTodo.mutate({ id: todo.id, completed: !todo.completed })}
                aria-label={todo.completed ? `'${todo.title}' 완료 취소` : `'${todo.title}' 완료 표시`}
                aria-pressed={todo.completed}
                className="w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer"
                style={{
                  background: todo.completed ? '#05D686' : 'transparent',
                  borderColor: todo.completed ? '#05D686' : '#48484A',
                }}>
                {todo.completed && <Check size={9} strokeWidth={3} style={{ color: '#0F0F0F' }} aria-hidden="true" />}
              </button>
              <span className={cn('text-[13px] flex-1 leading-snug flex items-center gap-2', todo.completed && 'line-through')}
                style={{ color: todo.completed ? '#636366' : '#AEAEB2' }}>
                <span className="truncate">{todo.title}</span>
                {todo.due_date && (
                  <span style={{ fontSize: 10, color: '#636366', flexShrink: 0 }}>
                    {format(new Date(todo.due_date), 'M/d')}
                  </span>
                )}
              </span>
              <button onClick={() => deleteTodo.mutate(todo.id)}
                aria-label={`'${todo.title}' 할일 삭제`}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-0.5 transition-all cursor-pointer shrink-0 rounded"
                style={{ color: '#636366' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FF453A')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}>
                <Trash2 size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
          {visibleTodos.length === 0 && (
            <p className="text-center py-4" style={{ fontFamily: PIXEL, fontSize: '7px', color: '#636366' }}>이 날짜에 할일 없음</p>
          )}
        </div>
      </div>
    </div>
  )
}
