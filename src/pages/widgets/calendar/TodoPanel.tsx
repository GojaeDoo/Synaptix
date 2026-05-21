import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  visibleTodos,
  filteredCount,
  type StatusFilter,
  type PriorityFilter,
  type TodoFilters,
} from '@/lib/todos'
import type { Todo } from '@/types'
import { CARD_BG, BORDER } from './constants'
import { AddTodoForm } from './AddTodoForm'
import { TodoFilterBar } from './TodoFilterBar'
import { TodoList } from './TodoList'

interface Props {
  todos: Todo[]
  selectedDate: string
  isLoading: boolean
  onAdd: (title: string, priority: Todo['priority']) => void
  onToggle: (todo: Todo) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
}

// 선택 날짜의 할 일 패널 — 추가 폼 + 필터 + 목록. 필터 상태는 목록/안내문구가 공유하므로 여기서 소유한다.
export function TodoPanel({ todos, selectedDate, isLoading, onAdd, onToggle, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [priority, setPriority] = useState<PriorityFilter>('all')

  const filters: TodoFilters = useMemo(() => ({ search, status, priority }), [search, status, priority])
  const visible = useMemo(() => visibleTodos(todos, selectedDate, filters), [todos, selectedDate, filters])
  const allFilteredCount = useMemo(() => filteredCount(todos, filters), [todos, filters])

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      {/* selected day header + add */}
      <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[15px] font-semibold" style={{ color: '#F2F2F7' }}>
              {format(parseISO(selectedDate), 'M월 d일 (EEE)', { locale: ko })}
            </p>
            <p className="text-[11px]" style={{ color: '#636366', marginTop: 2 }}>
              {visible.length}개 표시 중
            </p>
          </div>
        </div>
        <AddTodoForm selectedDate={selectedDate} onAdd={onAdd} />
      </div>

      <TodoFilterBar
        search={search}
        status={status}
        priority={priority}
        onSearch={setSearch}
        onStatus={setStatus}
        onPriority={setPriority}
      />

      <TodoList
        todos={visible}
        isLoading={isLoading}
        otherDatesCount={allFilteredCount}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}
