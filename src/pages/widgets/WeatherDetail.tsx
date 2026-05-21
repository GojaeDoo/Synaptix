import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { WidgetDetailLayout } from '@/layouts/WidgetDetailLayout'
import { useWeather, useWeatherForecast } from '@/hooks/useWeather'
import { hourlySlots, dailyAggregates } from '@/lib/weather'
import { WeatherHero } from './weather/WeatherHero'
import { DetailsGrid } from './weather/DetailsGrid'
import { HourlyForecast } from './weather/HourlyForecast'
import { DailyForecast } from './weather/DailyForecast'
import { LoadingState } from './weather/LoadingState'

export function WeatherDetail() {
  const qc = useQueryClient()
  const { data: current, isLoading: loadingCurrent, isDemoMode } = useWeather()
  const { data: forecast, isLoading: loadingForecast } = useWeatherForecast()

  const hourly = useMemo(() => hourlySlots(forecast), [forecast])
  const daily = useMemo(() => dailyAggregates(forecast), [forecast])

  const onRefresh = () => {
    qc.invalidateQueries({ queryKey: ['weather'] })
    qc.invalidateQueries({ queryKey: ['forecast'] })
  }

  if (loadingCurrent || !current) return <LoadingState />

  const isNight = current.icon?.endsWith('n') ?? false

  return (
    <WidgetDetailLayout
      title="날씨"
      kicker="WEATHER"
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
      <WeatherHero current={current} isNight={isNight} />
      <DetailsGrid current={current} />
      <HourlyForecast hourly={hourly} isLoading={loadingForecast} />
      <DailyForecast daily={daily} isLoading={loadingForecast} />
    </WidgetDetailLayout>
  )
}
