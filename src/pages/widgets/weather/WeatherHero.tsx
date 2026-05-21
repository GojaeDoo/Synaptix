import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Sunrise, Sunset } from 'lucide-react'
import { WeatherEffects } from '@/components/widgets/WeatherEffects'
import { getWeatherEffect } from '@/lib/weatherEffect'
import { iconUrl, formatTime } from '@/lib/weather'
import type { WeatherData } from '@/types'

interface Props {
  current: WeatherData
  isNight: boolean
}

// 현재 기온 히어로 — 배경 그라데이션 + 날씨 효과 + 일출/일몰.
export function WeatherHero({ current, isNight }: Props) {
  const effect = getWeatherEffect(current.code, current.temp)

  return (
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
          <p className="text-[16px] sm:text-[18px] mt-3 capitalize" style={{ color: 'rgba(255,255,255,0.85)' }}>
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
  )
}
