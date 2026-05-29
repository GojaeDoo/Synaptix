import { describe, it, expect } from 'vitest'
import {
  timeToMinutes,
  sortStops,
  formatTimeRange,
  courseSpan,
  encodeCourse,
  decodeCourse,
} from './course'
import type { Course, CourseStop } from '@/types'

function stop(over: Partial<CourseStop> = {}): CourseStop {
  return {
    id: over.id ?? 'sx',
    startTime: '14:00',
    endTime: '15:00',
    memo: '데이트',
    location: { name: '광장시장', address: '서울 종로구', lat: 37.5701, lng: 126.9997, category: '음식점', url: null },
    ...over,
  }
}

function course(over: Partial<Course> = {}): Course {
  return { title: '데이트 코스', date: '2026-06-07', stops: [stop()], ...over }
}

describe('timeToMinutes', () => {
  it('converts HH:MM to minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('14:30')).toBe(870)
    expect(timeToMinutes('23:59')).toBe(1439)
  })
})

describe('sortStops', () => {
  it('orders by start time ascending without mutating input', () => {
    const input = [
      stop({ id: 'b', startTime: '18:00' }),
      stop({ id: 'a', startTime: '14:00' }),
      stop({ id: 'c', startTime: '16:00' }),
    ]
    expect(sortStops(input).map((s) => s.id)).toEqual(['a', 'c', 'b'])
    expect(input[0].id).toBe('b') // 원본 보존
  })
})

describe('formatTimeRange', () => {
  it('renders start–end', () => {
    expect(formatTimeRange({ startTime: '14:00', endTime: '15:30' })).toBe('14:00–15:30')
  })
})

describe('courseSpan', () => {
  it('returns earliest start and latest end', () => {
    const c = course({
      stops: [
        stop({ startTime: '16:00', endTime: '17:00' }),
        stop({ startTime: '14:00', endTime: '15:00' }),
        stop({ startTime: '18:00', endTime: '19:30' }),
      ],
    })
    expect(courseSpan(c)).toEqual({ start: '14:00', end: '19:30' })
  })

  it('returns null for an empty course', () => {
    expect(courseSpan(course({ stops: [] }))).toBeNull()
  })
})

describe('encodeCourse / decodeCourse', () => {
  it('round-trips a course (with Korean text)', () => {
    const c = course({
      stops: [
        stop({ startTime: '14:00', endTime: '15:00', memo: '데이트' }),
        stop({ startTime: '18:00', endTime: '19:00', memo: '식사', location: { name: '망원시장', address: '서울 마포구', lat: 37.556, lng: 126.9018, category: '음식점', url: null } }),
      ],
    })
    const decoded = decodeCourse(encodeCourse(c))
    expect(decoded).not.toBeNull()
    expect(decoded!.title).toBe('데이트 코스')
    expect(decoded!.date).toBe('2026-06-07')
    expect(decoded!.stops).toHaveLength(2)
    expect(decoded!.stops[1].location.name).toBe('망원시장')
    expect(decoded!.stops[1].location.lat).toBe(37.556)
    expect(decoded!.stops[0].memo).toBe('데이트')
  })

  it('regenerates stop ids on decode', () => {
    const decoded = decodeCourse(encodeCourse(course()))
    expect(decoded!.stops[0].id).toBeTruthy()
  })

  it('produces a URL-safe string (no +, /, =)', () => {
    const encoded = encodeCourse(course())
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('returns empty string for a course with no stops', () => {
    expect(encodeCourse(course({ stops: [] }))).toBe('')
  })

  it('returns null for garbage / empty input (untrusted URL)', () => {
    expect(decodeCourse('')).toBeNull()
    expect(decodeCourse('!!!not-base64!!!')).toBeNull()
    expect(decodeCourse('eyJmb28iOiJiYXIifQ')).toBeNull() // valid base64 of {"foo":"bar"} but wrong shape
  })

  it('rejects a tampered course missing required fields', () => {
    // 좌표 없는 stop을 강제로 인코딩한 뒤 디코딩 → 스키마 검증 실패로 null
    const bad = btoa(JSON.stringify({ t: 'x', d: null, s: [{ st: '14:00', et: '15:00', m: '', n: 'a' }] }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeCourse(bad)).toBeNull()
  })

  it('rejects an over-long course (too many stops)', () => {
    const many = course({ stops: Array.from({ length: 21 }, (_, i) => stop({ id: `s${i}` })) })
    expect(decodeCourse(encodeCourse(many))).toBeNull()
  })
})
