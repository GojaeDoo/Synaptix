import { useMemo, useState } from 'react'
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
  isBefore,
  startOfDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Check,
  Trash2,
  Search,
  CircleDashed,
  CircleCheck,
  Flag,
  X,
} from 'lucide-react'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useTodos } from '@/hooks/useTodos'
import { useCalendarStore } from '@/store/calendarStore'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types'

const CARD_BG = '#1A1A1A'
const BORDER = 'rgba(255,255,255,0.07)'
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

const PRIORITY_COLOR: Record<Todo['priority'], string> = {
  high: '#FF453A',
  medium: '#FFB74D',
  low: '#60A5FA',
}
const PRIORITY_LABEL: Record<Todo['priority'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

type StatusFilter = 'all' | 'pending' | 'done'

const fieldStyle: React.CSSProperties = {
  height: 38,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 13,
  color: '#F2F2F7',
  outline: 'none',
}

export function CalendarDetail() {
  const month = useCalendarStore((s) => s.month)
  const setMonth = useCalendarStore((s) => s.setMonth)
  const selectedDate = useCalendarStore((s) => s.selectedDate)
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate)
  const { data: todos = [], isLoading, addTodo, toggleTodo, updateTodo, deleteTodo } = useTodos()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Todo['priority']>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Todo['priority']>('medium')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    priority: 'medium' as Todo['priority'],
    due_date: '' as string | '',
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const pad = getDay(startOfMonth(month))

  const todosByDate = useMemo(() => {
    const map: Record<string, Todo[]> = {}
    for (const t of todos) {
      if (!t.due_date) continue
      if (!map[t.due_date]) map[t.due_date] = []
      map[t.due_date].push(t)
    }
    return map
  }, [todos])

  const todayStart = startOfDay(new Date())
  const overdueCount = useMemo(
    () =>
      todos.filter(
        (t) => !t.completed && t.due_date && isBefore(parseISO(t.due_date), todayStart)
      ).length,
    [todos, todayStart]
  )

  const visibleTodos = useMemo(() => {
    let list = todos.filter((t) => t.due_date === selectedDate)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q))
    if (statusFilter === 'pending') list = list.filter((t) => !t.completed)
    if (statusFilter === 'done') list = list.filter((t) => t.completed)
    if (priorityFilter !== 'all') list = list.filter((t) => t.priority === priorityFilter)
    const PRIORITY_RANK: Record<Todo['priority'], number> = { high: 0, medium: 1, low: 2 }
    return [...list].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    })
  }, [todos, selectedDate, search, statusFilter, priorityFilter])

  const allFilteredCount = useMemo(() => {
    let list = todos
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q))
    if (statusFilter === 'pending') list = list.filter((t) => !t.completed)
    if (statusFilter === 'done') list = list.filter((t) => t.completed)
    if (priorityFilter !== 'all') list = list.filter((t) => t.priority === priorityFilter)
    return list.length
  }, [todos, search, statusFilter, priorityFilter])

  const pending = todos.filter((t) => !t.completed).length
  const done = todos.filter((t) => t.completed).length

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addTodo.mutate({
      title: newTitle.trim(),
      completed: false,
      due_date: selectedDate,
      priority: newPriority,
    })
    setNewTitle('')
  }

  const startEdit = (todo: Todo) => {
    setEditForm({
      title: todo.title,
      priority: todo.priority,
      due_date: todo.due_date ?? '',
    })
    setEditingId(todo.id)
  }

  const submitEdit = () => {
    if (!editingId || !editForm.title.trim()) return
    updateTodo.mutate({
      id: editingId,
      patch: {
        title: editForm.title.trim(),
        priority: editForm.priority,
        due_date: editForm.due_date || null,
      },
    })
    setEditingId(null)
  }

  const confirmDeleteTodo = todos.find((t) => t.id === confirmDeleteId) ?? null

  return (
    <WidgetDetailLayout
      title="할 일"
      kicker="TODO"
      subtitle={`총 ${todos.length}개 · 진행 중 ${pending}개 · 완료 ${done}개`}
      accent="#3182F6"
    >
      {/* stat cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
        {[
          { label: '전체', value: todos.length, color: '#F2F2F7', icon: <Flag size={14} /> },
          { label: '진행 중', value: pending, color: '#3182F6', icon: <CircleDashed size={14} /> },
          { label: '완료', value: done, color: '#05D686', icon: <CircleCheck size={14} /> },
          { label: '기한 지남', value: overdueCount, color: overdueCount > 0 ? '#FF453A' : '#636366', icon: <Flag size={14} /> },
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

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        {/* calendar */}
        <div
          className="rounded-2xl p-5"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
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
              <p
                key={d}
                className="text-center py-1 text-[10px] tracking-wider"
                style={{ color: '#636366' }}
              >
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

        {/* todos */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          {/* selected day header + add */}
          <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[15px] font-semibold" style={{ color: '#F2F2F7' }}>
                  {format(parseISO(selectedDate), 'M월 d일 (EEE)', { locale: ko })}
                </p>
                <p className="text-[11px]" style={{ color: '#636366', marginTop: 2 }}>
                  {visibleTodos.length}개 표시 중
                </p>
              </div>
            </div>

            {/* add form */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={`${format(parseISO(selectedDate), 'M/d')}에 할 일 추가`}
                className="w-full sm:w-auto sm:flex-1"
                style={fieldStyle}
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Todo['priority'])}
                className="sm:w-[100px]"
                style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
              >
                <option value="high" style={{ background: '#141730' }}>높음</option>
                <option value="medium" style={{ background: '#141730' }}>보통</option>
                <option value="low" style={{ background: '#141730' }}>낮음</option>
              </select>
              <button
                onClick={handleAdd}
                className="flex items-center justify-center gap-1.5 px-4 h-[38px] rounded-xl text-[13px] font-medium cursor-pointer transition-colors"
                style={{ background: '#3182F6', color: '#ffffff' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#5c6ecc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#3182F6')}
              >
                <Plus size={13} />
                추가
              </button>
            </div>
          </div>

          {/* filter */}
          <div
            className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <div className="relative w-full sm:flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#636366' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="할 일 검색"
                aria-label="할 일 제목으로 검색"
                type="search"
                className="w-full"
                style={{ ...fieldStyle, paddingLeft: 32 }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 sm:shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="min-w-0 sm:w-[110px]"
                style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
              >
                <option value="all" style={{ background: '#141730' }}>전체</option>
                <option value="pending" style={{ background: '#141730' }}>진행 중</option>
                <option value="done" style={{ background: '#141730' }}>완료</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as 'all' | Todo['priority'])}
                className="min-w-0 sm:w-[110px]"
                style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
              >
                <option value="all" style={{ background: '#141730' }}>모든 우선순위</option>
                <option value="high" style={{ background: '#141730' }}>높음</option>
                <option value="medium" style={{ background: '#141730' }}>보통</option>
                <option value="low" style={{ background: '#141730' }}>낮음</option>
              </select>
            </div>
          </div>

          {/* todos list */}
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : visibleTodos.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <p className="text-[13px]" style={{ color: '#8E8E93' }}>
                이 날짜에 할 일이 없어요
              </p>
              <p className="text-[12px]" style={{ color: '#636366' }}>
                {allFilteredCount > 0
                  ? `다른 날짜에 ${allFilteredCount}개의 할 일이 있어요`
                  : '위에서 새 할 일을 추가해보세요'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {visibleTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    'flex items-center gap-3 px-5 py-3.5 group transition-colors',
                    todo.completed && 'opacity-50'
                  )}
                  style={{ borderColor: BORDER }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <button
                    onClick={() => toggleTodo.mutate({ id: todo.id, completed: !todo.completed })}
                    className="w-[20px] h-[20px] shrink-0 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer"
                    style={{
                      background: todo.completed ? '#05D686' : 'transparent',
                      borderColor: todo.completed ? '#05D686' : '#48484A',
                    }}
                  >
                    {todo.completed && <Check size={11} strokeWidth={3} style={{ color: '#0F0F0F' }} />}
                  </button>
                  <div
                    className="w-1 h-6 rounded-full shrink-0"
                    style={{ background: PRIORITY_COLOR[todo.priority] }}
                    title={PRIORITY_LABEL[todo.priority]}
                  />
                  <span
                    className={cn('flex-1 text-[14px] leading-snug truncate', todo.completed && 'line-through')}
                    style={{ color: todo.completed ? '#636366' : '#F2F2F7' }}
                  >
                    {todo.title}
                  </span>
                  <span
                    className="hidden sm:inline-block text-[10px] px-2 py-1 rounded-md shrink-0"
                    style={{ background: `${PRIORITY_COLOR[todo.priority]}20`, color: PRIORITY_COLOR[todo.priority] }}
                  >
                    {PRIORITY_LABEL[todo.priority]}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => startEdit(todo)}
                      className="p-1 transition-colors cursor-pointer rounded"
                      style={{ color: '#636366' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#3182F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                      aria-label="수정"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(todo.id)}
                      className="p-1 transition-colors cursor-pointer rounded"
                      style={{ color: '#636366' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FF453A')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                      aria-label="삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* edit modal */}
      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditingId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden fade-up"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <p className="text-[15px] font-semibold" style={{ color: '#F2F2F7' }}>
                할 일 수정
              </p>
              <button
                onClick={() => setEditingId(null)}
                className="p-1 cursor-pointer transition-colors rounded-lg"
                style={{ color: '#636366' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                placeholder="할 일 제목"
                style={{ ...fieldStyle, width: '100%' }}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as Todo['priority'] }))}
                  style={{ ...fieldStyle, width: '100%', cursor: 'pointer', paddingRight: 8 }}
                >
                  <option value="high" style={{ background: '#141730' }}>높음</option>
                  <option value="medium" style={{ background: '#141730' }}>보통</option>
                  <option value="low" style={{ background: '#141730' }}>낮음</option>
                </select>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                  style={{ ...fieldStyle, width: '100%' }}
                />
              </div>
              {editForm.due_date && (
                <button
                  onClick={() => setEditForm((f) => ({ ...f, due_date: '' }))}
                  className="text-[11.5px] cursor-pointer transition-colors"
                  style={{ color: '#8E8E93' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F7')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8E8E93')}
                >
                  마감일 없애기
                </button>
              )}
            </div>
            <div className="flex gap-2 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#F2F2F7' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                취소
              </button>
              <button
                onClick={submitEdit}
                disabled={!editForm.title.trim()}
                className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: '#3182F6', color: '#ffffff' }}
                onMouseEnter={(e) => { if (editForm.title.trim()) e.currentTarget.style.background = '#5c6ecc' }}
                onMouseLeave={(e) => { if (editForm.title.trim()) e.currentTarget.style.background = '#3182F6' }}
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* delete confirmation modal */}
      {confirmDeleteTodo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden fade-up"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <p className="text-[15px] font-semibold" style={{ color: '#F2F2F7' }}>
                할 일 삭제
              </p>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="p-1 cursor-pointer transition-colors rounded-lg"
                style={{ color: '#636366' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F2F2F7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#AEAEB2' }}>
                이 할 일을 삭제하시겠어요? 되돌릴 수 없습니다.
              </p>
              <div
                className="rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-1 h-4 rounded-full shrink-0"
                    style={{ background: PRIORITY_COLOR[confirmDeleteTodo.priority] }}
                  />
                  <p className="text-[14px] font-medium truncate" style={{ color: '#F2F2F7' }}>
                    {confirmDeleteTodo.title}
                  </p>
                </div>
                <p className="text-[12px]" style={{ color: '#8E8E93' }}>
                  {PRIORITY_LABEL[confirmDeleteTodo.priority]}
                  {confirmDeleteTodo.due_date && (
                    <>
                      <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                      {format(parseISO(confirmDeleteTodo.due_date), 'M월 d일 (EEE)', { locale: ko })}
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#F2F2F7' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                취소
              </button>
              <button
                onClick={() => {
                  deleteTodo.mutate(confirmDeleteTodo.id)
                  setConfirmDeleteId(null)
                }}
                className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
                style={{ background: '#FF453A', color: '#ffffff' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E03A30')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FF453A')}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </WidgetDetailLayout>
  )
}
