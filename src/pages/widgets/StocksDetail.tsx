import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useStocks } from '@/hooks/useStocks'
import { useCryptos } from '@/hooks/useCryptos'
import { useWidgetStore } from '@/store/widgetStore'
import { cn } from '@/lib/utils'
import { computeStats, type Tab } from '@/lib/stocks'
import type { StockQuote } from '@/types'
import { StatsCards } from './stocks/StatsCards'
import { ChangeChart } from './stocks/ChangeChart'
import { WatchlistEditor } from './stocks/WatchlistEditor'
import { QuoteTable } from './stocks/QuoteTable'
import { ACCENT } from './stocks/constants'

export function StocksDetail() {
  const qc = useQueryClient()
  const symbols = useWidgetStore((s) => s.settings.stockSymbols)
  const updateSettings = useWidgetStore((s) => s.updateSettings)

  const stocksQ = useStocks()
  const cryptosQ = useCryptos()
  const [tab, setTab] = useState<Tab>('stocks')

  const quotes = useMemo(
    () => (tab === 'stocks' ? stocksQ.stocks : cryptosQ.cryptos).filter(Boolean) as StockQuote[],
    [tab, stocksQ.stocks, cryptosQ.cryptos],
  )
  const stats = useMemo(() => computeStats(quotes), [quotes])
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

  const tabBtn = (key: Tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={cn(
        'px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer',
        tab === key
          ? 'bg-[#3182F6] text-white'
          : 'text-[#8E8E93] bg-[rgba(255,255,255,0.05)] hover:text-white',
      )}
    >
      {label}
    </button>
  )

  return (
    <WidgetDetailLayout
      title="시장"
      kicker="STOCKS"
      subtitle="주식과 암호화폐 시세"
      accent={ACCENT}
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

      <StatsCards stats={stats} />
      {quotes.length > 0 && <ChangeChart quotes={quotes} />}
      {/* 암호화폐는 고정 목록이라 주식 탭에서만 편집 */}
      {tab === 'stocks' && (
        <WatchlistEditor
          symbols={symbols}
          onAdd={(s) => updateSettings({ stockSymbols: [...symbols, s] })}
          onRemove={(s) => updateSettings({ stockSymbols: symbols.filter((x) => x !== s) })}
        />
      )}
      <QuoteTable quotes={quotes} isLoading={isLoading} />
    </WidgetDetailLayout>
  )
}
