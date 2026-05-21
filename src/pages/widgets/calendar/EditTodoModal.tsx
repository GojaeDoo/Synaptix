import { useState } from 'react'
import { X } from 'lucide-react'
import type { Todo } from '@/types'
import { CARD_BG, BORDER, fieldStyle } from './constants'

interface Props {
  todo: Todo
  onClose: () => void
  onSave: (patch: { title: string; priority: Todo['priority']; due_date: string | null }) => void
}

// 할 일 수정 모달. 부모가 todo.id를 key로 마운트하므로 초기 상태가 대상에 맞춰진다.
export function EditTodoModal({ todo, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    title: todo.title,
    priority: todo.priority,
    due_date: todo.due_date ?? '',
  })

  const submit = () => {
    if (!form.title.trim()) return
    onSave({
      title: form.title.trim(),
      priority: form.priority,
      due_date: form.due_date || null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden fade-up"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-[15px] font-semibold" style={{ color: '#F2F2F7' }}>
            할 일 수정
          </p>
          <button
            onClick={onClose}
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
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="할 일 제목"
            style={{ ...fieldStyle, width: '100%' }}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Todo['priority'] }))}
              style={{ ...fieldStyle, width: '100%', cursor: 'pointer', paddingRight: 8 }}
            >
              <option value="high" style={{ background: '#141730' }}>높음</option>
              <option value="medium" style={{ background: '#141730' }}>보통</option>
              <option value="low" style={{ background: '#141730' }}>낮음</option>
            </select>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              style={{ ...fieldStyle, width: '100%' }}
            />
          </div>
          {form.due_date && (
            <button
              onClick={() => setForm((f) => ({ ...f, due_date: '' }))}
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
            onClick={onClose}
            className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#F2F2F7' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={!form.title.trim()}
            className="flex-1 h-10 rounded-xl transition-colors cursor-pointer text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: '#3182F6', color: '#ffffff' }}
            onMouseEnter={(e) => { if (form.title.trim()) e.currentTarget.style.background = '#5c6ecc' }}
            onMouseLeave={(e) => { if (form.title.trim()) e.currentTarget.style.background = '#3182F6' }}
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  )
}
