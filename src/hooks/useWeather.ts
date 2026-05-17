import { useQuery } from '@tanstack/react-query'
import {
  fetchWeather,
  fetchWeatherByCoords,
  fetchForecast,
  fetchForecastByCoords,
} from '@/lib/api'
import { withMockOnConfigError } from '@/lib/queryFallback'
import { mockWeather, mockForecast } from '@/lib/mockData'
import { useWidgetStore } from '@/store/widgetStore'
import { useGeolocation } from './useGeolocation'

export function useWeather() {
  const city = useWidgetStore((s) => s.settings.weatherCity)
  const { coords, status } = useGeolocation()

  const useCoords = status === 'granted' && coords !== null
  const queryKey = useCoords
    ? ['weather', 'coords', coords!.lat, coords!.lon]
    : ['weather', 'city', city]

  const query = useQuery({
    queryKey,
    queryFn: () =>
      withMockOnConfigError(
        useCoords
          ? () => fetchWeatherByCoords(coords!.lat, coords!.lon)
          : () => fetchWeather(city),
        mockWeather
      ),
    enabled: status !== 'pending',
    staleTime: 1000 * 60 * 10,
  })

  return { ...query, isDemoMode: query.data === mockWeather }
}

export function useWeatherForecast() {
  const city = useWidgetStore((s) => s.settings.weatherCity)
  const { coords, status } = useGeolocation()

  const useCoords = status === 'granted' && coords !== null
  const queryKey = useCoords
    ? ['forecast', 'coords', coords!.lat, coords!.lon]
    : ['forecast', 'city', city]

  const query = useQuery({
    queryKey,
    queryFn: () =>
      withMockOnConfigError(
        useCoords
          ? () => fetchForecastByCoords(coords!.lat, coords!.lon)
          : () => fetchForecast(city),
        mockForecast
      ),
    enabled: status !== 'pending',
    staleTime: 1000 * 60 * 30,
  })

  return { ...query, isDemoMode: query.data === mockForecast }
}
