import { useState } from 'react'
import { X, Pencil, Trash2, Check, Plus } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { useBudgetGoals } from '@/hooks/useBudgetGoals'
import { CARD_BG, BORDER, fieldStyle, getCategoryColor } from './constants'

interface Props {
  onClose: () => void
}

// 카테고리 추가/이름 변경/삭제를 한 곳에서 처리하는 모달.
// 이름을 바꾸면 그 카테고리를 쓰던 기존 거래·예산 목표도 함께 새 이름으로 옮겨준다.
export function CategoryManageModal({ onClose }: Props) {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const { categories, addCategory, renameCategory, removeCategory } = useCategories()
  const { data: txns = [], updateTransaction } = useTransactions()
  const { goals, setGoal, removeGoal } = useBudgetGoals()

  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [newName, setNewName] = useState('')

  const list = categories[type]

  const applyRename = (oldName: string) => {
    const trimmed = draft.trim()
    setEditing(null)
    if (!trimmed || trimmed === oldName || list.includes(trimmed)) return

    renameCategory(type, oldName, trimmed)
    txns
      .filter((t) => t.category === oldName)
      .forEach((t) => updateTransaction.mutate({ id: t.id, patch: { category: trimmed } }))
    if (goals[oldName] != null) {
      setGoal(trimmed, goals[oldName])
      removeGoal(oldName)
    }
  }

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    addCategory(type, trimmed)
    setNewName('')
  }

  const handleRemove = (name: string) => {
    removeCategory(type, name)
    if (goals[name] != null) removeGoal(name)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden fade-up"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <p className="text-[15px] font-semibold" style={{ color: '#F2F2F7' }}>
            카테고리 관리
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

        <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="flex-1 py-3 transition-all cursor-pointer text-[13px] font-medium"
              style={{
                background:
                  type === t
                    ? t === 'expense'
                      ? 'rgba(255,67,58,0.1)'
                      : 'rgba(5,214,134,0.1)'
                    : 'transparent',
                color: type === t ? (t === 'expense' ? '#FF453A' : '#05D686') : '#636366',
              }}
            >
              {t === 'expense' ? '지출' : '수입'}
            </button>
          ))}
        </div>

        <div className="p-4 max-h-[320px] overflow-y-auto space-y-1">
          {list.map((c) => (
            <div key={c} className="flex items-center gap-2 py-1.5">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: getCategoryColor(c) }}
              />
              {editing === c ? (
                <>
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applyRename(c)
                      if (e.key === 'Escape') setEditing(null)
                    }}
                    style={{ ...fieldStyle, height: 30, flex: 1 }}
                  />
                  <button
                    onClick={() => applyRename(c)}
                    className="shrink-0 cursor-pointer p-1 rounded transition-colors"
                    style={{ color: '#3182F6' }}
                    aria-label="이름 저장"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="shrink-0 cursor-pointer p-1 rounded transition-colors"
                    style={{ color: '#636366' }}
                    aria-label="취소"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[13px] truncate" style={{ color: '#F2F2F7' }}>
                    {c}
                  </span>
                  <button
                    onClick={() => {
                      setEditing(c)
                      setDraft(c)
                    }}
                    className="shrink-0 cursor-pointer p-1 rounded transition-colors"
                    style={{ color: '#636366' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#3182F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                    aria-label={`${c} 이름 수정`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleRemove(c)}
                    className="shrink-0 cursor-pointer p-1 rounded transition-colors"
                    style={{ color: '#636366' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF453A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                    aria-label={`${c} 삭제`}
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}
          {list.length === 0 && (
            <p className="text-[12px] py-4 text-center" style={{ color: '#636366' }}>
              카테고리가 없습니다
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 pb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="새 카테고리명"
            style={{ ...fieldStyle, flex: 1 }}
          />
          <button
            onClick={handleAdd}
            className="shrink-0 h-[38px] px-3 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[13px] font-medium"
            style={{ background: '#3182F6', color: '#ffffff' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#5c6ecc')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#3182F6')}
          >
            <Plus size={14} />
            추가
          </button>
        </div>
      </div>
    </div>
  )
}
