import { useMemo } from 'react'
import { RefreshCw, ArrowUpRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fromUnixTime } from 'date-fns'
import { useWeather, useWeatherForecast } from '@/hooks/useWeather'
import { nextDays } from '@/lib/forecast'
import { WeatherEffects } from './WeatherEffects'
import { getWeatherEffect } from '@/lib/weatherEffect'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function PixelCloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 80 40"
      className={`absolute [image-rendering:pixelated] ${className ?? ''}`}
      style={style}
    >
      <rect x="8"  y="24" width="64" height="8" fill="white" />
      <rect x="8"  y="16" width="8"  height="8" fill="white" />
      <rect x="16" y="16" width="48" height="8" fill="white" />
      <rect x="56" y="16" width="16" height="8" fill="white" />
      <rect x="16" y="8"  width="16" height="8" fill="white" />
      <rect x="24" y="0"  width="8"  height="8" fill="white" />
      <rect x="48" y="8"  width="16" height="8" fill="white" />
      <rect x="48" y="0"  width="8"  height="8" fill="white" />
    </svg>
  )
}

export function WeatherWidget() {
  const navigate = useNavigate()
  const { data, isLoading, isDemoMode } = useWeather()
  const { data: forecast } = useWeatherForecast()
  const qc = useQueryClient()
  const isNight = data?.icon?.endsWith('n') ?? false
  const bgClass = isNight ? 'bg-[#1a1d2e]' : 'bg-card-alt'

  const forecastDays = useMemo(() => {
    if (!forecast) return []
    return nextDays(forecast.slots, 3).map((d) => ({
      day: DAYS[fromUnixTime(d.ts).getDay()],
      temp: d.high,
    }))
  }, [forecast])

  if (isLoading) {
    return (
      <div id="widget-weather" className={`h-full rounded-2xl p-4 flex flex-col gap-4 ${bgClass}`}>
        <div className="skeleton h-2 w-16" />
        <div className="skeleton h-10 w-28 mt-4" />
        <div className="skeleton h-2 w-20 mt-2" />
        <div className="mt-auto skeleton h-8 rounded-lg" />
      </div>
    )
  }
  if (!data) return null

  const effect = getWeatherEffect(data.code, data.temp)
  const cityLabel = isDemoMode ? `${data.city.toUpperCase()} · DEMO` : data.city.toUpperCase()
  const slots = forecastDays.length === 3 ? forecastDays : [null, null, null]

  const refreshBtn = (
    <button
      onClick={(e) => {
        e.stopPropagation()
        qc.invalidateQueries({ queryKey: ['weather'] })
        qc.invalidateQueries({ queryKey: ['forecast'] })
      }}
      aria-label="날씨 새로고침"
      className="text-t4 hover:text-white hover:bg-white/10 p-1 rounded transition-colors cursor-pointer"
    >
      <RefreshCw size={10} aria-hidden="true" />
    </button>
  )
  const weatherLabel = (
    <button
      onClick={(e) => { e.stopPropagation(); navigate('/widgets/weather') }}
      aria-label="날씨 상세 페이지로 이동"
      className="flex items-center gap-1.5 cursor-pointer group bg-transparent"
    >
      <span className="text-[8px] text-t3 tracking-[0.1em] group-hover:text-white group-hover/card:text-white transition-colors">
        WEATHER
      </span>
      <ArrowUpRight size={11} className="text-t4 group-hover:text-white group-hover/card:text-white transition-colors" aria-hidden="true" />
    </button>
  )

  return (
    <div
      id="widget-weather"
      onClick={() => navigate('/widgets/weather')}
      className={`group/card h-full rounded-[8px] relative overflow-hidden font-pixel cursor-pointer transition-shadow duration-200 widget-glass ${bgClass}`}
    >
      <PixelCloud
        className="w-[130px] h-[65px] -top-2 -left-5"
        style={{ opacity: isNight ? 0.14 : 0.24 }}
      />
      <PixelCloud
        className="w-[90px] h-[45px] top-7 -right-[18px]"
        style={{ opacity: isNight ? 0.09 : 0.16 }}
      />
      <PixelCloud
        className="w-[100px] h-[50px] top-[70px] left-[60px]"
        style={{ opacity: isNight ? 0.06 : 0.11 }}
      />

      <WeatherEffects effect={effect} isNight={isNight} />

      {/* ── 모바일 ─────────────────────────────── */}
      <div className="sm:hidden relative z-10 flex flex-col h-full px-5 pt-6 pb-5">
        <div className="flex justify-between items-center mb-4">
          {weatherLabel}
          {refreshBtn}
        </div>

        <div className="flex-1 flex flex-col justify-center gap-2">
          <p
            className="text-white leading-none"
            style={{ fontSize: 'clamp(42px, 11vw, 56px)', textShadow: '3px 3px 0 rgba(0,0,0,0.4)' }}
          >
            {data.temp}°
          </p>
          <p className="truncate text-[13px] text-t3 uppercase tracking-[0.04em]">
            {data.description}
          </p>
          <p className="text-[10px] text-t5 tracking-[0.08em]">{cityLabel}</p>
        </div>

        <div className="grid grid-cols-3 pt-3 border-t border-white/[0.07]">
          {slots.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-1.5 ${i < 2 ? 'border-r border-white/[0.07]' : ''}`}
            >
              <p className="text-[6px] text-t3">{d?.day ?? '—'}</p>
              <p className="text-[12px] text-t1">{d ? `${d.temp}°` : '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 데스크톱 ───────────────────────────── */}
      <div className="hidden sm:flex relative z-10 flex-col h-full pl-5 pr-5 pt-[18px] pb-5">
        <div className="flex items-center justify-between">
          {weatherLabel}
          {refreshBtn}
        </div>

        <div className="mt-2.5">
          <p
            className="text-white leading-none"
            style={{ fontSize: 'clamp(44px, 11vw, 60px)', textShadow: '4px 4px 0 rgba(0,0,0,0.4)' }}
          >
            {data.temp}°
          </p>
          <p className="mt-3.5 text-[14px] text-t3 uppercase tracking-[0.1em]">
            {data.description}
          </p>
        </div>

        <div className="flex-1" />

        <p className="mb-3 text-[6px] text-t5 tracking-[0.12em]">{cityLabel}</p>

        <div className="grid grid-cols-3 pt-3 border-t border-white/[0.07]">
          {slots.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-2 ${i < 2 ? 'border-r border-white/[0.07]' : ''}`}
            >
              <p className="text-[6px] text-t3 tracking-[0.08em]">{d?.day ?? '—'}</p>
              <p className="text-[11px] text-t1">{d ? `${d.temp}°` : '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
