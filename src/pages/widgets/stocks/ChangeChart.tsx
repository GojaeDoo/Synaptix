import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts'
import type { StockQuote } from '@/types'
import { CARD_BG, BORDER } from './constants'

// 종목별 변동률 막대 차트 (상승 초록 / 하락 빨강).
export function ChangeChart({ quotes }: { quotes: StockQuote[] }) {
  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <p className="text-[13px] font-medium mb-4" style={{ color: '#F2F2F7' }}>
        변동률 비교
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={quotes.map((s) => ({ symbol: s.symbol, change: s.changePercent }))}>
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
              {quotes.map((s) => (
                <Cell key={s.symbol} fill={s.changePercent >= 0 ? '#05D686' : '#FF453A'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
