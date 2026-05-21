import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { formatKRW } from '@/lib/utils'
import type { Summary } from '@/lib/budget'
import { CARD_BG, BORDER } from './constants'

// 모바일은 잔액 중심 통합 카드, 데스크톱은 수입/지출/잔액 3카드.
export function SummaryCards({ income, expense, balance }: Summary) {
  return (
    <>
      {/* mobile: combined card */}
      <div
        className="sm:hidden rounded-2xl p-5 mb-6"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-2 mb-2" style={{ color: '#8E8E93' }}>
          <Wallet size={14} />
          <p className="text-[12px] font-medium tracking-wide">잔액</p>
        </div>
        <p
          className="text-[28px] font-semibold tabular-nums tracking-tight mb-4"
          style={{ color: balance >= 0 ? '#F2F2F7' : '#FF453A' }}
        >
          {formatKRW(balance)}
        </p>
        <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: '#05D686' }}>
              <TrendingUp size={12} />
              <p className="text-[11px] font-medium" style={{ color: '#8E8E93' }}>
                수입
              </p>
            </div>
            <p className="text-[15px] font-semibold tabular-nums" style={{ color: '#05D686' }}>
              +{formatKRW(income)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: '#FF453A' }}>
              <TrendingDown size={12} />
              <p className="text-[11px] font-medium" style={{ color: '#8E8E93' }}>
                지출
              </p>
            </div>
            <p className="text-[15px] font-semibold tabular-nums" style={{ color: '#FF453A' }}>
              -{formatKRW(expense)}
            </p>
          </div>
        </div>
      </div>

      {/* desktop: 3 cards */}
      <div className="hidden sm:grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '수입', value: income, color: '#05D686', icon: <TrendingUp size={16} />, prefix: '+' },
          { label: '지출', value: expense, color: '#FF453A', icon: <TrendingDown size={16} />, prefix: '-' },
          {
            label: '잔액',
            value: balance,
            color: balance >= 0 ? '#F2F2F7' : '#FF453A',
            icon: <Wallet size={16} />,
            prefix: '',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl p-5"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: c.color }}>
              {c.icon}
              <p className="text-[12px] font-medium tracking-wide" style={{ color: '#8E8E93' }}>
                {c.label}
              </p>
            </div>
            <p className="text-[26px] font-semibold tabular-nums tracking-tight" style={{ color: c.color }}>
              {c.prefix}
              {formatKRW(c.value)}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
