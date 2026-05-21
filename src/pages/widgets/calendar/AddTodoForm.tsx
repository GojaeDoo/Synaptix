import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import type { Todo } from '@/types'
import { fieldStyle } from './constants'

interface Props {
  selectedDate: string
  onAdd: (title: string, priority: Todo['priority']) => void
}

// 선택 날짜에 할 일 추가. 입력 상태는 이 폼에만 필요해 내부에 둔다.
export function AddTodoForm({ selectedDate, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Todo['priority']>('medium')

  const submit = () => {
    if (!title.trim()) return
    onAdd(title.trim(), priority)
    setTitle('')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={`${format(parseISO(selectedDate), 'M/d')}에 할 일 추가`}
        className="w-full sm:w-auto sm:flex-1"
        style={fieldStyle}
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Todo['priority'])}
        className="sm:w-[100px]"
        style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
      >
        <option value="high" style={{ background: '#141730' }}>높음</option>
        <option value="medium" style={{ background: '#141730' }}>보통</option>
        <option value="low" style={{ background: '#141730' }}>낮음</option>
      </select>
      <button
        onClick={submit}
        className="flex items-center justify-center gap-1.5 px-4 h-[38px] rounded-xl text-[13px] font-medium cursor-pointer transition-colors"
        style={{ background: '#3182F6', color: '#ffffff' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#5c6ecc')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#3182F6')}
      >
        <Plus size={13} />
        추가
      </button>
    </div>
  )
}
