import { ArrowUp, ArrowDown } from 'lucide-react'
import type { MarketStats } from '@/lib/stocks'
import { CARD_BG, BORDER } from './constants'

// 종목 수 · 상승 · 하락 · 평균 변동 4-카드.
export function StatsCards({ stats }: { stats: MarketStats }) {
  return (
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
  )
}
