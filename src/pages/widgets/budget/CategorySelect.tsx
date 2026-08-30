import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { fieldStyle } from './constants'

const NEW_VALUE = '__new__'

interface Props {
  type: 'expense' | 'income'
  value: string
  onChange: (category: string) => void
}

// 카테고리 목록(기본값 + 사용자가 추가/수정한 것)을 보여주는 select.
// "+ 새 카테고리"를 고르면 입력창으로 바뀌어 그 자리에서 새 카테고리를 등록한다.
export function CategorySelect({ type, value, onChange }: Props) {
  const { categories, addCategory } = useCategories()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  // 카테고리 관리에서 이름이 바뀌거나 삭제돼도, 현재 선택된 값은 목록에서 사라지지 않게 한다.
  const options = categories[type].includes(value) ? categories[type] : [...categories[type], value]

  const commit = () => {
    const name = draft.trim()
    if (!name) {
      setAdding(false)
      return
    }
    addCategory(type, name)
    onChange(name)
    setDraft('')
    setAdding(false)
  }

  if (adding) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setAdding(false)
          }}
          placeholder="새 카테고리명"
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={commit}
          className="shrink-0 cursor-pointer p-1.5 rounded-lg transition-colors"
          style={{ color: '#3182F6' }}
          aria-label="카테고리 추가"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          onClick={() => setAdding(false)}
          className="shrink-0 cursor-pointer p-1.5 rounded-lg transition-colors"
          style={{ color: '#636366' }}
          aria-label="취소"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === NEW_VALUE) setAdding(true)
        else onChange(e.target.value)
      }}
      style={{ ...fieldStyle, cursor: 'pointer' }}
    >
      {options.map((c) => (
        <option key={c} value={c} style={{ background: '#141730' }}>
          {c}
        </option>
      ))}
      <option value={NEW_VALUE} style={{ background: '#141730' }}>
        + 새 카테고리
      </option>
    </select>
  )
}
