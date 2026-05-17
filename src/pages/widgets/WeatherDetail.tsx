import { useMemo } from 'react'
import { format, fromUnixTime } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  RefreshCw,
  Droplets,
  Wind,
  Thermometer,
  Eye,
  Gauge,
  Cloud,
  Sunrise,
  Sunset,
  CloudRain,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { WeatherEffects } from '@/components/widgets/WeatherEffects'
import { getWeatherEffect } from '@/lib/weatherEffect'
import { useWeather, useWeatherForecast } from '@/hooks/useWeather'
import { aggregateDaily, type DailyAggregate } from '@/lib/forecast'

const CARD_BG = '#1A1A1A'
const BORDER = 'rgba(255,255,255,0.07)'

function iconUrl(icon: string) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`
}

function formatTime(ts: number) {
  return format(fromUnixTime(ts), 'HH:mm')
}

function formatHour(ts: number) {
  return format(fromUnixTime(ts), 'HH시')
}

function formatDayLabel(ts: number, isToday: boolean) {
  if (isToday) return '오늘'
  return format(fromUnixTime(ts), 'EEE M/d', { locale: ko })
}


export function WeatherDetail() {
  const qc = useQueryClient()
  const { data: current, isLoading: loadingCurrent, isDemoMode } = useWeather()
  const { data: forecast, isLoading: loadingForecast } = useWeatherForecast()

  const isNight = current?.icon?.endsWith('n') ?? false
  const effect = current ? getWeatherEffect(current.code, current.temp) : 'none'

  const hourly = useMemo(
    () => forecast?.slots.slice(0, 8) ?? [],
    [forecast]
  )

  const daily = useMemo(() => {
    if (!forecast) return [] as DailyAggregate[]
    return aggregateDaily(forecast.slots).slice(0, 5)
  }, [forecast])

  const todayKey = format(new Date(), 'yyyy-MM-dd')

  const onRefresh = () => {
    qc.invalidateQueries({ queryKey: ['weather'] })
    qc.invalidateQueries({ queryKey: ['forecast'] })
  }

  if (loadingCurrent || !current) {
    return (
      <WidgetDetailLayout title="날씨" subtitle="현재 날씨와 예보" accent="#60A5FA">
        <div className="grid gap-4">
          <div className="skeleton h-44 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </WidgetDetailLayout>
    )
  }

  return (
    <WidgetDetailLayout
      title="날씨"
      subtitle={isDemoMode ? `${current.city} · 데모 데이터` : current.city}
      accent={isNight ? '#5B6CC9' : '#60A5FA'}
      actions={
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] text-[#8E8E93] hover:text-white bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={loadingForecast ? 'animate-spin' : ''} />
          새로고침
        </button>
      }
    >
      {/* hero */}
      <div
        className="rounded-2xl relative overflow-hidden mb-4"
        style={{
          background: isNight
            ? 'linear-gradient(135deg, #1a1d2e 0%, #2a2540 100%)'
            : 'linear-gradient(135deg, #1f2a44 0%, #2a4365 100%)',
          minHeight: 240,
        }}
      >
        <WeatherEffects effect={effect} isNight={isNight} />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
              {format(new Date(), 'M월 d일 EEEE · HH:mm', { locale: ko })}
            </p>
            <div className="flex items-end gap-4">
              <p
                className="text-[80px] sm:text-[100px] font-light leading-none tracking-tight tabular-nums"
                style={{ color: '#ffffff', textShadow: '4px 4px 0 rgba(0,0,0,0.3)' }}
              >
                {current.temp}°
              </p>
              <img
                src={iconUrl(current.icon)}
                alt={current.description}
                width={80}
                height={80}
                className="mb-2 select-none"
                style={{ imageRendering: 'auto' }}
              />
            </div>
            <p
              className="text-[16px] sm:text-[18px] mt-3 capitalize"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {current.description}
            </p>
            <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              체감 {current.feelsLike}°
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-col gap-3 sm:gap-2 shrink-0 sm:text-right">
            {current.sunrise && (
              <div className="flex items-center sm:justify-end gap-2">
                <Sunrise size={14} style={{ color: '#FFB74D' }} />
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {formatTime(current.sunrise)}
                </span>
              </div>
            )}
            {current.sunset && (
              <div className="flex items-center sm:justify-end gap-2">
                <Sunset size={14} style={{ color: '#FF8A65' }} />
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {formatTime(current.sunset)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {[
          { icon: <Thermometer size={14} />, label: '체감 온도', value: `${current.feelsLike}°`, color: '#FFB74D' },
          { icon: <Droplets size={14} />,   label: '습도',       value: `${current.humidity}%`,   color: '#60A5FA' },
          { icon: <Wind size={14} />,       label: '바람',       value: `${current.windSpeed.toFixed(1)} m/s`, color: '#A3E635' },
          { icon: <Gauge size={14} />,      label: '기압',       value: current.pressure ? `${current.pressure} hPa` : '—', color: '#C084FC' },
          { icon: <Cloud size={14} />,      label: '구름',       value: current.clouds != null ? `${current.clouds}%` : '—', color: '#94A3B8' },
          { icon: <Eye size={14} />,        label: '시야',       value: current.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : '—', color: '#34D399' },
        ].map((d) => (
          <div
            key={d.label}
            className="rounded-2xl p-4"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-1.5 mb-2" style={{ color: d.color }}>
              {d.icon}
              <p className="text-[11px] font-medium" style={{ color: '#8E8E93' }}>
                {d.label}
              </p>
            </div>
            <p className="text-[18px] font-semibold tabular-nums" style={{ color: '#F2F2F7' }}>
              {d.value}
            </p>
          </div>
        ))}
      </div>

      {/* hourly chart */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-medium" style={{ color: '#F2F2F7' }}>
            시간별 예보
          </p>
          <p className="text-[11px]" style={{ color: '#636366' }}>
            앞으로 24시간 (3시간 간격)
          </p>
        </div>
        {loadingForecast ? (
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
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: '#636366', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
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

      {/* 5-day forecast */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-[13px] font-medium" style={{ color: '#F2F2F7' }}>
            5일 예보
          </p>
        </div>
        {loadingForecast ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : daily.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[12px]" style={{ color: '#636366' }}>예보 데이터를 불러올 수 없습니다</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {daily.map((d) => {
              const isToday = format(fromUnixTime(d.ts), 'yyyy-MM-dd') === todayKey
              return (
                <div
                  key={d.ts}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderColor: BORDER }}
                >
                  <p
                    className="w-20 sm:w-24 text-[13px] font-medium shrink-0"
                    style={{ color: isToday ? '#60A5FA' : '#F2F2F7' }}
                  >
                    {formatDayLabel(d.ts, isToday)}
                  </p>
                  <img src={iconUrl(d.icon)} alt={d.description} width={36} height={36} className="shrink-0 select-none" />
                  <p className="flex-1 text-[12px] truncate capitalize" style={{ color: '#8E8E93' }}>
                    {d.description}
                  </p>
                  {d.pop > 0.1 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <CloudRain size={11} style={{ color: '#60A5FA' }} />
                      <span className="text-[11px] tabular-nums" style={{ color: '#60A5FA' }}>
                        {Math.round(d.pop * 100)}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 shrink-0 tabular-nums">
                    <span className="text-[14px]" style={{ color: '#636366' }}>
                      {d.low}°
                    </span>
                    <span className="text-[14px] font-semibold" style={{ color: '#F2F2F7' }}>
                      {d.high}°
                    </span>
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
