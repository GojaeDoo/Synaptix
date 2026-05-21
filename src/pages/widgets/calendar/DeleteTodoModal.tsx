import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X } from 'lucide-react'
import type { Todo } from '@/types'
import { CARD_BG, BORDER, PRIORITY_COLOR, PRIORITY_LABEL } from './constants'

interface Props {
  todo: Todo
  onClose: () => void
  onConfirm: () => void
}

// 할 일 삭제 확인 모달.
export function DeleteTodoModal({ todo, onClose, onConfirm }: Props) {
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
            할 일 삭제
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
        <div className="px-5 py-5">
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#AEAEB2' }}>
            이 할 일을 삭제하시겠어요? 되돌릴 수 없습니다.
          </p>
          <div
            className="rounded-xl p-3.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-4 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[todo.priority] }} />
              <p className="text-[14px] font-medium truncate" style={{ color: '#F2F2F7' }}>
                {todo.title}
              </p>
            </div>
            <p className="text-[12px]" style={{ color: '#8E8E93' }}>
              {PRIORITY_LABEL[todo.priority]}
              {todo.due_date && (
                <>
                  <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                  {format(parseISO(todo.due_date), 'M월 d일 (EEE)', { locale: ko })}
                </>
              )}
            </p>
          </div>
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
            onClick={onConfirm}
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
  )
}
