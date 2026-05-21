import { useMemo, useState } from 'react'
import { Search, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { formatUSD } from '@/lib/utils'
import { filterAndSort, type SortMode } from '@/lib/stocks'
import type { StockQuote } from '@/types'
import { CARD_BG, BORDER, fieldStyle } from './constants'

interface Props {
  quotes: StockQuote[]
  isLoading: boolean
}

// 검색·정렬 필터 + 시세 테이블. 필터 상태는 이 카드에만 필요해 내부에 둔다.
export function QuoteTable({ quotes, isLoading }: Props) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('change-desc')

  const list = useMemo(() => filterAndSort(quotes, search, sort), [quotes, search, sort])

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      {/* filter */}
      <div
        className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="relative w-full sm:flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#636366' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="티커/이름 검색"
            aria-label="티커 또는 이름으로 검색"
            type="search"
            className="w-full"
            style={{ ...fieldStyle, paddingLeft: 32 }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="sm:w-[150px]"
          style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 8 }}
        >
          <option value="change-desc" style={{ background: '#141730' }}>변동률↓</option>
          <option value="change-asc" style={{ background: '#141730' }}>변동률↑</option>
          <option value="price-desc" style={{ background: '#141730' }}>가격↓</option>
          <option value="price-asc" style={{ background: '#141730' }}>가격↑</option>
          <option value="symbol" style={{ background: '#141730' }}>티커순</option>
        </select>
      </div>

      {/* rows */}
      {isLoading ? (
        <div className="p-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[13px]" style={{ color: '#8E8E93' }}>조건에 맞는 종목이 없습니다</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: BORDER }}>
          {list.map((s) => {
            const pos = s.changePercent > 0
            const neg = s.changePercent < 0
            const color = pos ? '#05D686' : neg ? '#FF453A' : '#8E8E93'
            const Icon = pos ? ArrowUp : neg ? ArrowDown : Minus
            return (
              <div
                key={s.symbol}
                className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 sm:gap-6 items-center px-5 py-4 transition-colors"
                style={{ borderColor: BORDER }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold tracking-tight truncate" style={{ color: '#F2F2F7' }}>
                    {s.symbol}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: '#8E8E93', marginTop: 2 }}>
                    {s.name}
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[10px]" style={{ color: '#636366' }}>저가 / 고가</p>
                  <p className="text-[12px] tabular-nums" style={{ color: '#AEAEB2', marginTop: 2 }}>
                    {formatUSD(s.low)} <span style={{ color: '#48484A' }}>·</span> {formatUSD(s.high)}
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-[10px]" style={{ color: '#636366' }}>종가 대비</p>
                  <p className="text-[12px] tabular-nums" style={{ color, marginTop: 2 }}>
                    {pos ? '+' : ''}{s.change.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-semibold tabular-nums" style={{ color: '#F2F2F7' }}>
                    {formatUSD(s.price)}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <Icon size={11} style={{ color }} />
                    <span className="text-[12px] font-medium tabular-nums" style={{ color }}>
                      {Math.abs(s.changePercent).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
