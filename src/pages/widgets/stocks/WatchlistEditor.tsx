import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { CARD_BG, BORDER, fieldStyle } from './constants'

interface Props {
  symbols: string[]
  onAdd: (symbol: string) => void
  onRemove: (symbol: string) => void
}

// 관심 종목(티커) 추가/삭제. 입력 상태는 이 카드에만 필요해 내부에 둔다.
export function WatchlistEditor({ symbols, onAdd, onRemove }: Props) {
  const [newSymbol, setNewSymbol] = useState('')

  const submit = () => {
    const s = newSymbol.trim().toUpperCase()
    if (s && !symbols.includes(s)) onAdd(s)
    setNewSymbol('')
  }

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <p className="text-[13px] font-medium mb-3" style={{ color: '#F2F2F7' }}>
        종목 관리
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {symbols.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#F2F2F7' }}
          >
            {s}
            <button
              onClick={() => onRemove(s)}
              className="p-0.5 rounded text-[#636366] hover:text-[#FF453A] cursor-pointer transition-colors"
              aria-label={`${s} 제거`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="티커 추가 (예: AAPL)"
          className="flex-1"
          style={fieldStyle}
        />
        <button
          onClick={submit}
          className="flex items-center gap-1.5 px-4 rounded-xl text-[13px] font-medium cursor-pointer transition-colors"
          style={{ background: '#3182F6', color: '#ffffff' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#5c6ecc')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#3182F6')}
        >
          <Plus size={13} />
          추가
        </button>
      </div>
    </div>
  )
}
