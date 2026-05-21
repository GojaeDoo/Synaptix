import { describe, it, expect } from 'vitest'
import { getWeatherEffect } from './weatherEffect'

describe('getWeatherEffect', () => {
  it('maps snow codes (6xx) to "snow"', () => {
    expect(getWeatherEffect(600, 5)).toBe('snow')
    expect(getWeatherEffect(699, 5)).toBe('snow')
  })

  it('maps rain/thunder codes (2xx–5xx) to "rain"', () => {
    expect(getWeatherEffect(200, 20)).toBe('rain')
    expect(getWeatherEffect(500, 20)).toBe('rain')
    expect(getWeatherEffect(599, 20)).toBe('rain')
  })

  it('prefers precipitation code over temperature', () => {
    // 눈 오는데 영하여도 freeze가 아니라 snow가 이긴다
    expect(getWeatherEffect(601, -10)).toBe('snow')
    // 비 오는데 30도여도 hot이 아니라 rain
    expect(getWeatherEffect(501, 35)).toBe('rain')
  })

  it('falls back to temperature when sky is clear (8xx)', () => {
    expect(getWeatherEffect(800, 30)).toBe('hot')
    expect(getWeatherEffect(800, 0)).toBe('freeze')
    expect(getWeatherEffect(800, 20)).toBe('none')
  })

  it('treats the hot/freeze thresholds as inclusive', () => {
    expect(getWeatherEffect(800, 30)).toBe('hot')
    expect(getWeatherEffect(800, 29)).toBe('none')
    expect(getWeatherEffect(800, 0)).toBe('freeze')
    expect(getWeatherEffect(800, 1)).toBe('none')
  })
})
