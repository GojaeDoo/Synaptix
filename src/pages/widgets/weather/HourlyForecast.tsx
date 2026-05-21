import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { CloudRain } from 'lucide-react'
import { iconUrl, formatHour } from '@/lib/weather'
import type { ForecastSlot } from '@/types'
import { CARD_BG, BORDER } from './constants'

interface Props {
  hourly: ForecastSlot[]
  isLoading: boolean
}

// 시간별 예보 — 온도 면적 차트 + 시간 카드(강수확률).
export function HourlyForecast({ hourly, isLoading }: Props) {
  return (
    <div className="rounded-2xl p-5 mb-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-medium" style={{ color: '#F2F2F7' }}>
          시간별 예보
        </p>
        <p className="text-[11px]" style={{ color: '#636366' }}>
          앞으로 24시간 (3시간 간격)
        </p>
      </div>
      {isLoading ? (
        <div className="skeleton h-48 rounded-xl" />
      ) : hourly.length === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-[12px]" style={{ color: '#636366' }}>예보 데이터를 불러올 수 없습니다</p>
        </div>
      ) : (
        <>
          <div className="h-44 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly.map((h) => ({ ...h, hour: formatHour(h.ts) }))}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#636366', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#636366', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}°`}
                  width={30}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
                  contentStyle={{
                    background: '#222222',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    fontSize: 12,
                    padding: '8px 12px',
                  }}
                  formatter={(v) => [`${v}°`, '온도']}
                  labelStyle={{ color: '#8E8E93' }}
                />
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  fill="url(#tempGradient)"
                  dot={{ fill: '#60A5FA', r: 3 }}
                  activeDot={{ r: 5, fill: '#60A5FA' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* hour cards */}
          <div className="mt-4 grid grid-cols-4 sm:grid-cols-8 gap-2">
            {hourly.map((h) => (
              <div
                key={h.ts}
                className="flex flex-col items-center gap-1 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <p className="text-[10px]" style={{ color: '#8E8E93' }}>{formatHour(h.ts)}</p>
                <img src={iconUrl(h.icon)} alt={h.description} width={32} height={32} className="select-none" />
                <p className="text-[12px] font-semibold tabular-nums" style={{ color: '#F2F2F7' }}>
                  {h.temp}°
                </p>
                {h.pop > 0.1 && (
                  <div className="flex items-center gap-0.5">
                    <CloudRain size={9} style={{ color: '#60A5FA' }} />
                    <span className="text-[9px] tabular-nums" style={{ color: '#60A5FA' }}>
                      {Math.round(h.pop * 100)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
