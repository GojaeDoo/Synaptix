import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatKRW } from '@/lib/utils'
import type { TrendPoint, PieSlice } from '@/lib/budget'
import { CARD_BG, BORDER, CAT_COLOR } from './constants'

interface Props {
  trendTitle: string
  trendData: TrendPoint[]
  pieData: PieSlice[]
  expense: number
}

// 추이 막대 차트 + 카테고리별 지출 파이.
export function BudgetCharts({ trendTitle, trendData, pieData, expense }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {/* trend */}
      <div
        className="lg:col-span-2 rounded-2xl p-5"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <p className="text-[13px] font-medium mb-4" style={{ color: '#F2F2F7' }}>
          {trendTitle}
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} barGap={4}>
              <XAxis dataKey="label" tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#636366', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 10000 ? `${Math.round(v / 10000)}만` : `${v}`)}
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
                formatter={(v) => formatKRW(Number(v))}
              />
              <Bar dataKey="수입" fill="#05D686" radius={[4, 4, 0, 0]} />
              <Bar dataKey="지출" fill="#FF453A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* categories */}
      <div className="rounded-2xl p-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <p className="text-[13px] font-medium mb-4" style={{ color: '#F2F2F7' }}>
          카테고리별 지출
        </p>
        {pieData.length === 0 ? (
          <div className="h-56 flex items-center justify-center">
            <p className="text-[12px]" style={{ color: '#636366' }}>
              지출 내역이 없습니다
            </p>
          </div>
        ) : (
          <>
            <div className="h-32 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    dataKey="value"
                    strokeWidth={2}
                    stroke={CARD_BG}
                  >
                    {pieData.map((e) => (
                      <Cell key={e.name} fill={CAT_COLOR[e.name] ?? '#52525B'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#222222',
                      border: `1px solid ${BORDER}`,
                      borderRadius: 12,
                      fontSize: 12,
                      padding: '8px 12px',
                    }}
                    formatter={(v) => formatKRW(Number(v))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: CAT_COLOR[d.name] ?? '#52525B' }}
                    />
                    <span className="truncate" style={{ color: '#AEAEB2' }}>
                      {d.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span style={{ color: '#636366' }}>
                      {expense > 0 ? Math.round((d.value / expense) * 100) : 0}%
                    </span>
                    <span className="tabular-nums" style={{ color: '#F2F2F7' }}>
                      {formatKRW(d.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
