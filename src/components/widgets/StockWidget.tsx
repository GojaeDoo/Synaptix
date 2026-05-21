import { useMemo, useState } from 'react'
import { RefreshCw, ArrowUpRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useStocks } from '@/hooks/useStocks'
import { useCryptos } from '@/hooks/useCryptos'
import { formatUSD } from '@/lib/utils'

const PIXEL = "'Press Start 2P', monospace"
const BG = 'rgba(38, 38, 38, 0.72)'
const BORDER = 'rgba(255,255,255,0.07)'

type Tab = 'stocks' | 'crypto'

function PixelBars({ style }: { style: React.CSSProperties }) {
  const bars: [number, number][] = [[0, 18], [14, 8], [28, 2], [42, 14], [56, 6]]
  return (
    <svg viewBox="0 0 72 32" style={{ position: 'absolute', imageRendering: 'pixelated', ...style }}>
      {bars.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={8} height={32 - y} fill="white" />
      ))}
    </svg>
  )
}

const CANDLE_W = 6
const CANDLE_GAP = 4
const CANDLE_STRIDE = CANDLE_W + CANDLE_GAP
const CANDLE_COUNT = 50

function MarketsEffect({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const candles = useMemo(() => {
    return Array.from({ length: CANDLE_COUNT }, (_, i) => {
      const seed = (i * 37 + 13) % 100
      const upBias = trend === 'up' ? 7 : trend === 'down' ? 3 : 5
      const isUp = seed % 10 < upBias
      const bodyH = 8 + (seed % 14)
      const wickTop = 1 + (seed % 4)
      const wickBot = 1 + ((seed * 3) % 4)
      const yOffset = (seed % 6)
      return { isUp, bodyH, wickTop, wickBot, yOffset }
    })
  }, [trend])

  const upColor = 'rgba(5, 214, 134, 0.55)'
  const downColor = 'rgba(255, 69, 58, 0.5)'
  const setWidth = CANDLE_COUNT * CANDLE_STRIDE

  return (
    <div className="absolute left-0 right-0 pointer-events-none overflow-hidden" style={{ bottom: 0, height: 50 }}>
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          left: 0,
          display: 'flex',
          gap: `${CANDLE_GAP}px`,
          animation: `market-scroll 40s linear infinite`,
          width: setWidth * 2,
        }}
      >
        {[...candles, ...candles].map((c, i) => {
          const color = c.isUp ? upColor : downColor
          return (
            <div key={i} style={{ width: CANDLE_W, position: 'relative', flexShrink: 0, height: 36 }}>
              <div style={{
                position: 'absolute',
                left: CANDLE_W / 2 - 1,
                bottom: c.bodyH + c.yOffset,
                width: 2,
                height: c.wickTop,
                background: color,
                imageRendering: 'pixelated',
              }} />
              <div style={{
                position: 'absolute',
                left: 0,
                bottom: c.yOffset,
                width: CANDLE_W,
                height: c.bodyH,
                background: color,
                imageRendering: 'pixelated',
              }} />
              <div style={{
                position: 'absolute',
                left: CANDLE_W / 2 - 1,
                bottom: Math.max(0, c.yOffset - c.wickBot),
                width: 2,
                height: c.wickBot,
                background: color,
                imageRendering: 'pixelated',
              }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StockWidget() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('stocks')
  const stocksQ = useStocks()
  const cryptosQ = useCryptos()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const active = tab === 'stocks' ? stocksQ.stocks : cryptosQ.cryptos
  const isLoading = tab === 'stocks' ? stocksQ.isLoading : cryptosQ.isLoading
  const onRefresh = () => {
    if (tab === 'stocks') {
      qc.invalidateQueries({ queryKey: ['stock'] })
      stocksQ.refetch()
    } else {
      qc.invalidateQueries({ queryKey: ['cryptos'] })
      cryptosQ.refetch()
    }
  }

  if (isLoading) {
    return (
      <div id="widget-stocks" className="widget-glass h-full rounded-2xl p-5 flex flex-col gap-3" style={{ background: BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
      </div>
    )
  }

  const valid = active.filter(Boolean) as NonNullable<(typeof active)[number]>[]
  const displayed = expanded ? valid : valid.slice(0, 5)
  const top = valid[0]
  const upCount = valid.filter((s) => s.changePercent > 0).length
  const downCount = valid.filter((s) => s.changePercent < 0).length
  const hasMore = valid.length > 5
  const trend: 'up' | 'down' | 'flat' = upCount > downCount ? 'up' : downCount > upCount ? 'down' : 'flat'

  const detailBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); navigate('/widgets/stocks') }}
      className="flex items-center gap-1 cursor-pointer group p-1 -m-1 rounded"
      style={{ background: 'transparent' }}
      aria-label="시장 상세"
    >
      <ArrowUpRight size={12} className="text-[#636366] group-hover:text-white group-hover/card:text-white transition-colors" />
    </button>
  )

  const tabBtn = (key: Tab, label: string) => (
    <button
      onClick={(e) => { e.stopPropagation(); setTab(key); setExpanded(false) }}
      style={{
        fontFamily: PIXEL,
        fontSize: '8px',
        letterSpacing: '0.1em',
        color: tab === key ? '#F2F2F7' : '#636366',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 0',
        borderBottom: tab === key ? '1px solid #F2F2F7' : '1px solid transparent',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => { if (tab !== key) e.currentTarget.style.color = '#AEAEB2' }}
      onMouseLeave={(e) => { if (tab !== key) e.currentTarget.style.color = '#636366' }}
    >
      {label}
    </button>
  )

  return (
    <div
      id="widget-stocks"
      onClick={() => navigate('/widgets/stocks')}
      className="group/card widget-glass h-full rounded-2xl relative overflow-hidden cursor-pointer transition-shadow duration-200 hover:ring-1 hover:ring-white/15"
      style={{ background: BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <PixelBars style={{ width: 100, height: 45, bottom: 60, right: -8, opacity: 0.07 }} />
      <MarketsEffect trend={trend} />

      {/* mobile */}
      <div className="flex flex-col h-full sm:hidden relative z-10" style={{ padding: '24px 20px 20px' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            {tabBtn('stocks', 'STOCKS')}
            {tabBtn('crypto', 'CRYPTO')}
            {tab === 'stocks' && stocksQ.isDemoMode && (
              <span style={{ fontFamily: PIXEL, fontSize: '6px', color: '#636366', background: 'rgba(255,255,255,0.06)', padding: '3px 7px', borderRadius: 4 }}>DEMO</span>
            )}
          </div>
          {detailBtn}
        </div>

        {top && (
          <div className="flex-1 flex flex-col justify-center">
            <p style={{ fontFamily: PIXEL, fontSize: '9px', color: '#F2F2F7', letterSpacing: '0.06em', marginBottom: 6 }}>{top.symbol}</p>
            <p className="truncate" style={{ fontSize: '11px', color: '#8E8E93', marginBottom: 10 }}>{top.name}</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#F2F2F7', lineHeight: 1, letterSpacing: '-0.02em' }}>{formatUSD(top.price)}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, marginTop: 8, color: top.changePercent > 0 ? '#05D686' : '#FF453A' }}>
              {top.changePercent > 0 ? '▲' : '▼'} {Math.abs(top.changePercent).toFixed(2)}%
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#05D686' }} />
            <p style={{ fontSize: '13px', color: '#F2F2F7', whiteSpace: 'nowrap' }}>{upCount}개 상승</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#FF453A' }} />
            <p style={{ fontSize: '13px', color: '#F2F2F7', whiteSpace: 'nowrap' }}>{downCount}개 하락</p>
          </div>
        </div>
      </div>

      {/* desktop */}
      <div className="hidden sm:flex flex-col h-full relative z-10">
        <div className="flex items-center justify-between" style={{ padding: '18px 20px 12px' }}>
          <div className="flex items-center gap-4">
            {tabBtn('stocks', 'STOCKS')}
            {tabBtn('crypto', 'CRYPTO')}
            {tab === 'stocks' && stocksQ.isDemoMode && (
              <span style={{ fontFamily: PIXEL, fontSize: '6px', color: '#636366', background: 'rgba(255,255,255,0.05)', padding: '3px 6px', borderRadius: 4 }}>DEMO</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasMore && (
              <button onClick={(ev) => { ev.stopPropagation(); setExpanded((e) => !e) }}
                style={{ fontFamily: PIXEL, fontSize: '6px', color: '#8E8E93', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, padding: '4px 8px', borderRadius: 4, cursor: 'pointer', letterSpacing: '0.05em' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#AEAEB2')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#8E8E93')}
              >
                {expanded ? 'LESS' : `+${valid.length - 5} MORE`}
              </button>
            )}
            {detailBtn}
            <button onClick={(e) => { e.stopPropagation(); onRefresh() }} aria-label="주식 시세 새로고침" style={{ color: '#636366' }}
              className="hover:text-white transition-colors cursor-pointer p-1.5 rounded hover:bg-white/10">
              <RefreshCw size={10} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayed.map((stock, i) => {
            const pos = stock.changePercent > 0
            const neg = stock.changePercent < 0
            const changeColor = pos ? '#05D686' : neg ? '#FF453A' : '#8E8E93'
            const isLast = i === displayed.length - 1
            return (
              <div key={stock.symbol}
                className="flex items-center justify-between transition-colors"
                style={{ padding: '12px 20px', borderBottom: isLast ? 'none' : `1px solid ${BORDER}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <p style={{ fontFamily: PIXEL, fontSize: '8px', color: '#AEAEB2', letterSpacing: '0.05em' }}>{stock.symbol}</p>
                  <p style={{ fontSize: '11px', color: '#8E8E93' }}>{stock.name}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#F2F2F7', lineHeight: 1, letterSpacing: '-0.01em' }}>
                    {formatUSD(stock.price)}
                  </p>
                  <p style={{ fontFamily: PIXEL, fontSize: '7px', color: changeColor, letterSpacing: '0.04em' }}>
                    {pos ? '▲' : neg ? '▼' : '—'} {Math.abs(stock.changePercent).toFixed(2)}%
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
