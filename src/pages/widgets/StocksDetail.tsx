import { useMemo, useState } from 'react'
import { Search, RefreshCw, X, Plus, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useStocks } from '@/hooks/useStocks'
import { useCryptos } from '@/hooks/useCryptos'
import { useWidgetStore } from '@/store/widgetStore'
import { formatUSD, cn } from '@/lib/utils'
import type { StockQuote } from '@/types'

const CARD_BG = '#1A1A1A'
const BORDER = 'rgba(255,255,255,0.07)'

type Tab = 'stocks' | 'crypto'
type SortMode = 'change-desc' | 'change-asc' | 'price-desc' | 'price-asc' | 'symbol'

const fieldStyle: React.CSSProperties = {
  height: 38,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 13,
  color: '#F2F2F7',
  outline: 'none',
}

export function StocksDetail() {
  const qc = useQueryClient()
  const symbols = useWidgetStore((s) => s.settings.stockSymbols)
  const updateSettings = useWidgetStore((s) => s.updateSettings)

  const stocksQ = useStocks()
  const cryptosQ = useCryptos()
  const [tab, setTab] = useState<Tab>('stocks')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('change-desc')
  const [newSymbol, setNewSymbol] = useState('')

  const list: StockQuote[] = useMemo(() => {
    const raw = (tab === 'stocks' ? stocksQ.stocks : cryptosQ.cryptos).filter(Boolean) as StockQuote[]
    const q = search.trim().toLowerCase()
    let filtered = raw
    if (q) filtered = filtered.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    const sorted = [...filtered]
    switch (sort) {
      case 'change-asc':
        sorted.sort((a, b) => a.changePercent - b.changePercent)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'symbol':
        sorted.sort((a, b) => a.symbol.localeCompare(b.symbol))
        break
      default:
        sorted.sort((a, b) => b.changePercent - a.changePercent)
    }
    return sorted
  }, [tab, stocksQ.stocks, cryptosQ.cryptos, search, sort])

  const isLoading = tab === 'stocks' ? stocksQ.isLoading : cryptosQ.isLoading

  const stats = useMemo(() => {
    const all = (tab === 'stocks' ? stocksQ.stocks : cryptosQ.cryptos).filter(Boolean) as StockQuote[]
    const up = all.filter((s) => s.changePercent > 0).length
    const down = all.filter((s) => s.changePercent < 0).length
    const flat = all.length - up - down
    const avgChange = all.length > 0 ? all.reduce((s, q) => s + q.changePercent, 0) / all.length : 0
    return { total: all.length, up, down, flat, avgChange }
  }, [tab, stocksQ.stocks, cryptosQ.cryptos])

  const onRefresh = () => {
    if (tab === 'stocks') {
      qc.invalidateQueries({ queryKey: ['stock'] })
      stocksQ.refetch()
    } else {
      qc.invalidateQueries({ queryKey: ['cryptos'] })
      cryptosQ.refetch()
    }
  }

  const addSymbol = () => {
    const s = newSymbol.trim().toUpperCase()
    if (!s || symbols.includes(s)) {
      setNewSymbol('')
      return
    }
    updateSettings({ stockSymbols: [...symbols, s] })
    setNewSymbol('')
  }

  const removeSymbol = (s: string) => {
    updateSettings({ stockSymbols: symbols.filter((x) => x !== s) })
  }

  const tabBtn = (key: Tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={cn(
        'px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer',
        tab === key
          ? 'bg-[#3182F6] text-white'
          : 'text-[#8E8E93] bg-[rgba(255,255,255,0.05)] hover:text-white'
      )}
    >
      {label}
    </button>
  )

  return (
    <WidgetDetailLayout
      title="시장"
      subtitle="주식과 암호화폐 시세"
      accent="#05D686"
      actions={
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-[#8E8E93] hover:text-white bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          새로고침
        </button>
      }
    >
      {/* tabs */}
      <div className="flex items-center gap-2 mb-5">
        {tabBtn('stocks', '주식')}
        {tabBtn('crypto', '암호화폐')}
        {tab === 'stocks' && stocksQ.isDemoMode && (
          <span className="text-[10px] tracking-wider px-2 py-1 rounded-md" style={{ color: '#636366', background: 'rgba(255,255,255,0.05)' }}>
            DEMO
          </span>
        )}
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: '종목 수', value: stats.total.toString(), color: '#F2F2F7', icon: null },
          { label: '상승', value: `${stats.up}개`, color: '#05D686', icon: <ArrowUp size={14} /> },
          { label: '하락', value: `${stats.down}개`, color: '#FF453A', icon: <ArrowDown size={14} /> },
          {
            label: '평균 변동',
            value: `${stats.avgChange >= 0 ? '+' : ''}${stats.avgChange.toFixed(2)}%`,
            color: stats.avgChange >= 0 ? '#05D686' : '#FF453A',
            icon: stats.avgChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-1.5 mb-2" style={{ color: s.color }}>
              {s.icon}
              <p className="text-[11px] font-medium" style={{ color: '#8E8E93' }}>{s.label}</p>
            </div>
            <p className="text-[20px] font-semibold tabular-nums" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* change distribution chart */}
      {list.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <p className="text-[13px] font-medium mb-4" style={{ color: '#F2F2F7' }}>
            변동률 비교
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={list.map((s) => ({ symbol: s.symbol, change: s.changePercent }))}>
                <XAxis dataKey="symbol" tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#636366', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={42}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    background: '#222222',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    fontSize: 12,
                    padding: '8px 12px',
                  }}
                  formatter={(v) => [`${Number(v).toFixed(2)}%`, '변동']}
                />
                <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                  {list.map((s) => (
                    <Cell
                      key={s.symbol}
                      fill={s.changePercent >= 0 ? '#05D686' : '#FF453A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* watchlist editor — only stocks (cryptos are fixed list) */}
      {tab === 'stocks' && (
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
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
                  onClick={() => removeSymbol(s)}
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
              onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
              placeholder="티커 추가 (예: AAPL)"
              className="flex-1"
              style={fieldStyle}
            />
            <button
              onClick={addSymbol}
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
      )}

      {/* table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
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
    </WidgetDetailLayout>
  )
}
