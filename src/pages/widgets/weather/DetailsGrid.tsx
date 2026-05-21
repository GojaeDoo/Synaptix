import { Droplets, Wind, Thermometer, Eye, Gauge, Cloud } from 'lucide-react'
import type { WeatherData } from '@/types'
import { CARD_BG, BORDER } from './constants'

// 체감/습도/바람/기압/구름/시야 6-카드.
export function DetailsGrid({ current }: { current: WeatherData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {[
        { icon: <Thermometer size={14} />, label: '체감 온도', value: `${current.feelsLike}°`, color: '#FFB74D' },
        { icon: <Droplets size={14} />, label: '습도', value: `${current.humidity}%`, color: '#60A5FA' },
        { icon: <Wind size={14} />, label: '바람', value: `${current.windSpeed.toFixed(1)} m/s`, color: '#A3E635' },
        { icon: <Gauge size={14} />, label: '기압', value: current.pressure ? `${current.pressure} hPa` : '—', color: '#C084FC' },
        { icon: <Cloud size={14} />, label: '구름', value: current.clouds != null ? `${current.clouds}%` : '—', color: '#94A3B8' },
        { icon: <Eye size={14} />, label: '시야', value: current.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : '—', color: '#34D399' },
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
  )
}
