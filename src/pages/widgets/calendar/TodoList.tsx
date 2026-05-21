import { cn } from '@/lib/utils'
import { Check, Pencil, Trash2 } from 'lucide-react'
import type { Todo } from '@/types'
import { BORDER, PRIORITY_COLOR, PRIORITY_LABEL } from './constants'

interface Props {
  todos: Todo[]
  isLoading: boolean
  otherDatesCount: number
  onToggle: (todo: Todo) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
}

// 선택 날짜의 할 일 목록 (완료 토글 / 수정 / 삭제).
export function TodoList({ todos, isLoading, otherDatesCount, onToggle, onEdit, onDelete }: Props) {
  if (isLoading) {
    return (
      <div className="p-5 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-2">
        <p className="text-[13px]" style={{ color: '#8E8E93' }}>
          이 날짜에 할 일이 없어요
        </p>
        <p className="text-[12px]" style={{ color: '#636366' }}>
          {otherDatesCount > 0
            ? `다른 날짜에 ${otherDatesCount}개의 할 일이 있어요`
            : '위에서 새 할 일을 추가해보세요'}
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y" style={{ borderColor: BORDER }}>
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={cn('flex items-center gap-3 px-5 py-3.5 group transition-colors', todo.completed && 'opacity-50')}
          style={{ borderColor: BORDER }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <button
            onClick={() => onToggle(todo)}
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
              onClick={() => onEdit(todo)}
              className="p-1 transition-colors cursor-pointer rounded"
              style={{ color: '#636366' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#3182F6')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
              aria-label="수정"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
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
  )
}
