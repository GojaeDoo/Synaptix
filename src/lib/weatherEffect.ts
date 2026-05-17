export type WeatherEffect = 'rain' | 'snow' | 'hot' | 'freeze' | 'none'

export function getWeatherEffect(code: number, temp: number): WeatherEffect {
  if (code >= 600 && code < 700) return 'snow'
  if (code >= 200 && code < 600) return 'rain'
  if (temp >= 30) return 'hot'
  if (temp <= 0) return 'freeze'
  return 'none'
}
