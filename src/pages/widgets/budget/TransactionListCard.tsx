import { useMemo, useState } from 'react'
import { Search, Pencil, Trash2 } from 'lucide-react'
import { formatKRW, formatDate } from '@/lib/utils'
import {
  filterAndSort,
  availableCategories as deriveCategories,
  type TypeFilter,
  type SortMode,
} from '@/lib/budget'
import type { Transaction } from '@/types'
import { CARD_BG, BORDER, CAT_COLOR, fieldStyle } from './constants'

interface Props {
  rangeTxns: Transaction[]
  isLoading: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

// 검색·타입·카테고리·정렬 필터 + 거래 목록. 필터 상태는 이 카드에만 필요해 내부에 둔다.
export function TransactionListCard({ rangeTxns, isLoading, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortMode, setSortMode] = useState<SortMode>('date-desc')

  const filteredTxns = useMemo(
    () => filterAndSort(rangeTxns, { typeFilter, categoryFilter, search, sortMode }),
    [rangeTxns, typeFilter, categoryFilter, search, sortMode],
  )
  const categories = useMemo(() => deriveCategories(rangeTxns), [rangeTxns])

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      {/* filter bar */}
      <div
        className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#636366' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="내용 검색"
            aria-label="거래 내용으로 검색"
            type="search"
            style={{ ...fieldStyle, paddingLeft: 32 }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2 sm:shrink-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="min-w-0 sm:w-[110px]"
            style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
          >
            <option value="all" style={{ background: '#141730' }}>전체</option>
            <option value="income" style={{ background: '#141730' }}>수입</option>
            <option value="expense" style={{ background: '#141730' }}>지출</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-w-0 sm:w-[140px]"
            style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
          >
            {categories.map((c) => (
              <option key={c} value={c} style={{ background: '#141730' }}>
                {c === 'all' ? '카테고리' : c}
              </option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="min-w-0 sm:w-[130px]"
            style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
          >
            <option value="date-desc" style={{ background: '#141730' }}>최신순</option>
            <option value="date-asc" style={{ background: '#141730' }}>오래된순</option>
            <option value="amount-desc" style={{ background: '#141730' }}>금액↓</option>
            <option value="amount-asc" style={{ background: '#141730' }}>금액↑</option>
          </select>
        </div>
      </div>

      {/* list */}
      <div>
        {isLoading ? (
          <div className="p-5 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
                <div className="skeleton h-4 w-20" />
              </div>
            ))}
          </div>
        ) : filteredTxns.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <p className="text-[13px]" style={{ color: '#8E8E93' }}>
              조건에 맞는 내역이 없습니다
            </p>
            <p className="text-[12px]" style={{ color: '#636366' }}>
              {rangeTxns.length === 0
                ? '+ 추가 버튼으로 첫 거래를 기록해보세요'
                : '필터를 조정해보세요'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {filteredTxns.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 px-5 py-4 group transition-colors"
                style={{ borderColor: BORDER }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: `${CAT_COLOR[t.category] ?? '#52525B'}25` }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: CAT_COLOR[t.category] ?? '#52525B' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate leading-snug text-[14px] font-medium" style={{ color: '#F2F2F7' }}>
                    {t.description}
                  </p>
                  <p className="text-[12px]" style={{ color: '#8E8E93', marginTop: 2 }}>
                    {t.category}
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                    {formatDate(t.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p
                    className="text-[15px] font-semibold tabular-nums"
                    style={{ color: t.type === 'income' ? '#05D686' : '#F2F2F7' }}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatKRW(t.amount)}
                  </p>
                  <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => onEdit(t.id)}
                      className="p-1.5 transition-colors cursor-pointer rounded-lg"
                      style={{ color: '#636366' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#3182F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                      aria-label="수정"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="p-1.5 transition-colors cursor-pointer rounded-lg"
                      style={{ color: '#636366' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FF453A')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#636366')}
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* footer count */}
      {filteredTxns.length > 0 && (
        <div
          className="px-5 py-3 text-[12px]"
          style={{ borderTop: `1px solid ${BORDER}`, color: '#636366' }}
        >
          총 <span style={{ color: '#AEAEB2' }}>{filteredTxns.length}건</span>
          {filteredTxns.length !== rangeTxns.length && ` (전체 ${rangeTxns.length}건 중)`}
        </div>
      )}
    </div>
  )
}
