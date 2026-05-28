import { useMemo, useState } from 'react'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useTodos } from '@/hooks/useTodos'
import { useCalendarStore } from '@/store/calendarStore'
import { groupByDate, overdueCount, counts } from '@/lib/todos'
import { StatCards } from './calendar/StatCards'
import { CalendarGrid } from './calendar/CalendarGrid'
import { TodoPanel } from './calendar/TodoPanel'
import { EditTodoModal } from './calendar/EditTodoModal'
import { DeleteTodoModal } from './calendar/DeleteTodoModal'
import { NotificationToggle } from './calendar/NotificationToggle'
import { ACCENT } from './calendar/constants'

export function CalendarDetail() {
  const month = useCalendarStore((s) => s.month)
  const setMonth = useCalendarStore((s) => s.setMonth)
  const selectedDate = useCalendarStore((s) => s.selectedDate)
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate)
  const { data: todos = [], isLoading, addTodo, toggleTodo, updateTodo, deleteTodo } = useTodos()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const todosByDate = useMemo(() => groupByDate(todos), [todos])
  const overdue = useMemo(() => overdueCount(todos, new Date()), [todos])
  const todoCounts = useMemo(() => counts(todos), [todos])

  const editingTodo = todos.find((t) => t.id === editingId) ?? null
  const deletingTodo = todos.find((t) => t.id === confirmDeleteId) ?? null

  return (
    <WidgetDetailLayout
      title="할 일"
      kicker="TODO"
      subtitle={`총 ${todoCounts.total}개 · 진행 중 ${todoCounts.pending}개 · 완료 ${todoCounts.done}개`}
      accent={ACCENT}
      actions={<NotificationToggle />}
    >
      <StatCards counts={todoCounts} overdue={overdue} />

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        <CalendarGrid
          month={month}
          setMonth={setMonth}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          todosByDate={todosByDate}
        />
        <TodoPanel
          todos={todos}
          selectedDate={selectedDate}
          isLoading={isLoading}
          onAdd={(title, priority) =>
            addTodo.mutate({ title, completed: false, due_date: selectedDate, priority })
          }
          onToggle={(todo) => toggleTodo.mutate({ id: todo.id, completed: !todo.completed })}
          onEdit={(todo) => setEditingId(todo.id)}
          onDelete={setConfirmDeleteId}
        />
      </div>

      {editingTodo && (
        <EditTodoModal
          key={editingTodo.id}
          todo={editingTodo}
          onClose={() => setEditingId(null)}
          onSave={(patch) => {
            updateTodo.mutate({ id: editingTodo.id, patch })
            setEditingId(null)
          }}
        />
      )}

      {deletingTodo && (
        <DeleteTodoModal
          todo={deletingTodo}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            deleteTodo.mutate(deletingTodo.id)
            setConfirmDeleteId(null)
          }}
        />
      )}
    </WidgetDetailLayout>
  )
}
